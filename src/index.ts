import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { realpath, readdir, readFile, stat } from 'node:fs/promises'
import { basename, extname, relative, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Readable } from 'node:stream'

export const name = 'tobewin-dsh-developer-workbench'
export const inject = ['webServer', 'workspaceRegistry', 'subprocess']

// Stay under the GUI's documented API carrier. This preserves Electron's
// file:// fetch bridge while remaining a longer, plugin-owned web-server route.
const API_ROOT = '/api/tobewin/developer-workbench'
const MAX_FILE_BYTES = 512 * 1024
const MAX_OUTPUT_BYTES = 64 * 1024
const MAX_PREVIEW_BYTES = 32 * 1024 * 1024
const MAX_TREE_DEPTH = 5
const MAX_TERMINAL_CHUNKS = 4_000
const IGNORED = new Set(['.git', 'node_modules', '.DS_Store', 'dist', 'build', '.next', '.turbo', 'coverage'])

type TerminalOutcome = { exitCode: number | null, signal: NodeJS.Signals | null }
type TerminalHandle = {
  pid: number
  output: Readable
  done: Promise<TerminalOutcome>
  write(data: string): Promise<void>
  signalForeground(signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL' | 'SIGTSTP' | 'SIGHUP'): Promise<number>
  terminate(): Promise<void>
}

type TerminalRecord = {
  id: string
  root: string
  handle: TerminalHandle
  chunks: Array<{ sequence: number, data: string }>
  nextSequence: number
  closed: boolean
  outcome?: TerminalOutcome
  error?: string
}

type ContextLike = {
  webServer: { register(route: { kind: 'prefix', path: string, handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
  workspaceRegistry: { list(): Array<{ path: string, title?: string, id?: string }> }
  subprocess: {
    spawnTerminal(spec: {
      argv: readonly string[]
      cwd: string
      env?: Record<string, string>
      rows: number
      cols: number
      graceMs: number
    }): Promise<TerminalHandle>
  }
  effect(install: () => void | (() => void | Promise<void>), label: string): void
}

function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

function previewError(res: ServerResponse, status: number, message: string): void {
  const safeMessage = message.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
  res.end(`<!doctype html><html><meta charset="utf-8"><meta name="color-scheme" content="light dark"><style>body{box-sizing:border-box;display:grid;min-height:100vh;margin:0;padding:32px;place-items:center;background:Canvas;color:CanvasText;font:14px/1.6 system-ui,sans-serif}.message{max-width:520px;text-align:center}strong{display:block;margin-bottom:8px;font-size:16px}</style><div class="message"><strong>Preview could not be loaded</strong>${safeMessage}</div></html>`)
}

function decodePreviewToken(value: string | undefined, label: string): string {
  if (!value) throw new Error(`${label} is required`)
  try {
    return Buffer.from(value, 'base64url').toString('utf8')
  } catch {
    throw new Error(`${label} is invalid`)
  }
}

function requireLoopbackOrigin(value: string): URL {
  const origin = new URL(value)
  const hostname = origin.hostname.toLowerCase()
  const loopback = hostname === 'localhost' || hostname === '::1' || hostname === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(hostname)
  if ((origin.protocol !== 'http:' && origin.protocol !== 'https:') || !loopback) {
    throw new Error('the preview proxy only accepts localhost development servers')
  }
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('preview origin is invalid')
  }
  return origin
}

function proxyPrefix(rootToken: string, originToken: string): string {
  return `${API_ROOT}/preview/${rootToken}/${originToken}`
}

function previewBootstrap(prefix: string, target: URL): string {
  const script = `(() => {
    const prefix = ${JSON.stringify(prefix)};
    const targetOrigin = ${JSON.stringify(target.origin)};
    const proxyOrigin = window.location.origin;
    const mapUrl = (value) => {
      try {
        const url = new URL(String(value), targetOrigin);
        if (url.origin !== targetOrigin && url.origin !== proxyOrigin) return String(value);
        if (url.origin === proxyOrigin && url.pathname.startsWith(prefix + '/')) return url.href;
        return proxyOrigin + prefix + url.pathname + url.search + url.hash;
      } catch { return String(value); }
    };
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => input instanceof Request
      ? nativeFetch(new Request(mapUrl(input.url), input), init)
      : nativeFetch(mapUrl(input), init);
    const nativeOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      return nativeOpen.call(this, method, mapUrl(url), ...rest);
    };
    if (window.EventSource) {
      const NativeEventSource = window.EventSource;
      window.EventSource = function(url, options) { return new NativeEventSource(mapUrl(url), options); };
      window.EventSource.prototype = NativeEventSource.prototype;
    }
    history.replaceState(history.state, '', ${JSON.stringify(`${target.pathname}${target.search}${target.hash}`)});
  })();`
  return `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`
}

function rewritePreviewHtml(html: string, prefix: string, target: URL): string {
  const rewriteAttribute = (_match: string, name: string, quote: string, path: string) => `${name}=${quote}${prefix}/${path}`
  const rewritten = html
    .replace(/\b(src|href|action|poster)=(['"])\/(?!\/)([^'"]*)/gi, rewriteAttribute)
    .replace(/url\((['"]?)\/(?!\/)([^)'"\s]+)\1\)/gi, (_match, quote: string, path: string) => `url(${quote}${prefix}/${path}${quote})`)
  const bootstrap = previewBootstrap(prefix, target)
  if (/<head(?:\s[^>]*)?>/i.test(rewritten)) return rewritten.replace(/<head(?:\s[^>]*)?>/i, match => `${match}${bootstrap}`)
  return `${bootstrap}${rewritten}`
}

async function rawBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.byteLength
    if (size > MAX_PREVIEW_BYTES) throw new Error(`preview request exceeds ${MAX_PREVIEW_BYTES / 1024 / 1024} MB`)
    chunks.push(bytes)
  }
  return Buffer.concat(chunks)
}

function previewRequestHeaders(req: IncomingMessage, target: URL): Headers {
  const headers = new Headers()
  const omitted = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'origin', 'referer', 'transfer-encoding', 'upgrade'])
  for (const [name, value] of Object.entries(req.headers)) {
    if (omitted.has(name.toLowerCase()) || value === undefined) continue
    headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  headers.set('origin', target.origin)
  headers.set('referer', `${target.origin}/`)
  headers.set('user-agent', 'DSH-Developer-Workbench/0.1 local-preview')
  return headers
}

async function fetchLoopback(target: URL, req: IncomingMessage, requestBody: Buffer | undefined): Promise<Response> {
  let current = target
  let method = req.method || 'GET'
  let payload = requestBody
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const response = await fetch(current, {
      method,
      body: method === 'GET' || method === 'HEAD' || !payload
        ? undefined
        : payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength) as ArrayBuffer,
      redirect: 'manual',
      headers: previewRequestHeaders(req, current),
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) return response
    const location = response.headers.get('location')
    if (!location) return response
    const next = new URL(location, current)
    requireLoopbackOrigin(next.origin)
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === 'POST')) {
      method = 'GET'
      payload = undefined
    }
    current = next
  }
  throw new Error('the preview server redirected too many times')
}

async function proxyPreview(req: IncomingMessage, res: ServerResponse, endpoint: string, requestUrl: URL, ctx: ContextLike): Promise<void> {
  const segments = endpoint.split('/')
  const rootToken = segments[1]
  const originToken = segments[2]
  const root = decodePreviewToken(rootToken, 'workspace token')
  await requireRoot(ctx, root)
  const origin = requireLoopbackOrigin(decodePreviewToken(originToken, 'preview origin'))
  const encodedPath = segments.slice(3).join('/')
  const target = new URL(`/${encodedPath}${requestUrl.search}`, origin)
  const requestBody = await rawBody(req)
  const response = await fetchLoopback(target, req, requestBody)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > MAX_PREVIEW_BYTES) throw new Error(`preview response exceeds ${MAX_PREVIEW_BYTES / 1024 / 1024} MB`)

  const headers: Record<string, string | string[]> = {}
  response.headers.forEach((value, key) => {
    if (!['content-security-policy', 'content-security-policy-report-only', 'x-frame-options', 'content-length', 'content-encoding', 'transfer-encoding', 'connection', 'set-cookie'].includes(key.toLowerCase())) {
      headers[key] = value
    }
  })
  const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] }
  const cookies = responseHeaders.getSetCookie?.() || (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')!] : [])
  if (cookies.length) {
    headers['set-cookie'] = cookies.map(cookie => cookie
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*Path=[^;]*/gi, '; Path=/'))
  }
  headers['cache-control'] = 'no-store'
  headers['x-dsh-preview-target'] = target.origin
  const contentType = response.headers.get('content-type') || ''
  const output = contentType.includes('text/html')
    ? Buffer.from(rewritePreviewHtml(bytes.toString('utf8'), proxyPrefix(rootToken!, originToken!), target))
    : bytes
  headers['content-length'] = String(output.byteLength)
  res.writeHead(response.status, headers)
  res.end(output)
}

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    if (Buffer.concat(chunks).byteLength > 24 * 1024) throw new Error('request body is too large')
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return {}
  const parsed: unknown = JSON.parse(text)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('request body must be an object')
  return parsed as Record<string, unknown>
}

function registeredRoots(ctx: ContextLike): Array<{ path: string, title: string }> {
  return ctx.workspaceRegistry.list().map((workspace) => ({ path: workspace.path, title: workspace.title || basename(workspace.path) }))
}

async function requireRoot(ctx: ContextLike, value: unknown): Promise<string> {
  if (typeof value !== 'string' || !value) throw new Error('workspace root is required')
  const root = await realpath(value)
  if (!registeredRoots(ctx).some((workspace) => workspace.path === root)) throw new Error('workspace is not registered in DeepSeek Harness')
  return root
}

function within(root: string, requested: unknown): string {
  if (typeof requested !== 'string') throw new Error('path is required')
  const target = resolve(root, requested)
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error('path must stay inside the selected workspace')
  return target
}

async function directoryTree(root: string, directory: string, depth = 0): Promise<unknown[]> {
  if (depth > MAX_TREE_DEPTH) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const visible = entries.filter((entry) => !entry.name.startsWith('.') && !IGNORED.has(entry.name)).sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
    return a.name.localeCompare(b.name)
  }).slice(0, 160)
  return await Promise.all(visible.map(async (entry) => {
    const fullPath = resolve(directory, entry.name)
    const path = relative(root, fullPath)
    if (entry.isDirectory()) return { name: entry.name, path, kind: 'directory', children: await directoryTree(root, fullPath, depth + 1) }
    return { name: entry.name, path, kind: 'file', language: extname(entry.name).slice(1) }
  }))
}

function run(command: string, cwd: string): Promise<{ output: string, code: number | null, timedOut: boolean }> {
  return new Promise((done) => {
    const shell = process.platform === 'win32' ? 'cmd.exe' : (process.env.SHELL || '/bin/zsh')
    const child = spawn(command, { cwd, shell, env: process.env, windowsHide: true })
    let output = ''
    let timedOut = false
    const append = (chunk: Buffer) => { if (output.length < MAX_OUTPUT_BYTES) output += chunk.toString('utf8').slice(0, MAX_OUTPUT_BYTES - output.length) }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, 30_000)
    child.on('error', (error) => { clearTimeout(timer); done({ output: `${output}\n${error.message}`.trim(), code: null, timedOut }) })
    child.on('close', (code) => { clearTimeout(timer); done({ output: output || '(no output)', code, timedOut }) })
  })
}

function shellArgv(): string[] {
  if (process.platform === 'win32') {
    return [process.env.ComSpec || 'cmd.exe']
  }
  return [process.env.SHELL || '/bin/zsh', '-i']
}

function terminalEnvironment(): Record<string, string> {
  return {
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    DSH_WORKBENCH: '1',
  }
}

function appendTerminal(record: TerminalRecord, data: string): void {
  if (!data) return
  record.chunks.push({ sequence: record.nextSequence++, data })
  if (record.chunks.length > MAX_TERMINAL_CHUNKS) {
    record.chunks.splice(0, record.chunks.length - MAX_TERMINAL_CHUNKS)
  }
}

function requireTerminal(sessions: Map<string, TerminalRecord>, value: unknown): TerminalRecord {
  if (typeof value !== 'string' || !value) throw new Error('terminal session id is required')
  const session = sessions.get(value)
  if (session === undefined) throw new Error('terminal session was not found')
  return session
}

async function createTerminal(ctx: ContextLike, sessions: Map<string, TerminalRecord>, root: string): Promise<TerminalRecord> {
  const handle = await ctx.subprocess.spawnTerminal({
    argv: shellArgv(),
    cwd: root,
    env: terminalEnvironment(),
    rows: 30,
    cols: 120,
    graceMs: 2_000,
  })
  const record: TerminalRecord = {
    id: randomUUID(),
    root,
    handle,
    chunks: [],
    nextSequence: 1,
    closed: false,
  }
  sessions.set(record.id, record)
  void (async () => {
    try {
      for await (const chunk of handle.output) appendTerminal(record, Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk))
    } catch (error) {
      record.error = error instanceof Error ? error.message : 'terminal output failed'
    }
  })()
  void handle.done.then((outcome) => {
    record.closed = true
    record.outcome = outcome
  }, (error: unknown) => {
    record.closed = true
    record.error = error instanceof Error ? error.message : 'terminal transport failed'
  })
  return record
}

export function apply(ctx: ContextLike): void {
  const terminalSessions = new Map<string, TerminalRecord>()
  ctx.effect(() => async () => {
    const active = [...terminalSessions.values()]
    terminalSessions.clear()
    await Promise.allSettled(active.map(session => session.handle.terminate()))
  }, 'tobewin-developer-workbench: terminal cleanup')
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_ROOT,
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://dsh.internal')
        const endpoint = url.pathname.slice(API_ROOT.length).replace(/^\//, '')
        if (req.method === 'GET' && endpoint === 'roots') return json(res, 200, { roots: registeredRoots(ctx) })
        if (endpoint.startsWith('preview/')) {
          try {
            return await proxyPreview(req, res, endpoint, url, ctx)
          } catch (error) {
            return previewError(res, 400, error instanceof Error ? error.message : 'preview request failed')
          }
        }
        if (req.method === 'GET' && endpoint === 'tree') {
          const root = await requireRoot(ctx, url.searchParams.get('root'))
          return json(res, 200, { root, items: await directoryTree(root, root) })
        }
        if (req.method === 'GET' && endpoint === 'file') {
          const root = await requireRoot(ctx, url.searchParams.get('root'))
          const requested = url.searchParams.get('path') || ''
          const target = within(root, requested)
          const info = await stat(target)
          if (!info.isFile()) throw new Error('selected path is not a file')
          if (info.size > MAX_FILE_BYTES) throw new Error(`file is larger than ${MAX_FILE_BYTES / 1024} KB`)
          const bytes = await readFile(target)
          if (bytes.includes(0)) throw new Error('binary files cannot be displayed')
          return json(res, 200, { path: requested, content: bytes.toString('utf8'), language: extname(target).slice(1) })
        }
        if (req.method === 'POST' && endpoint === 'command') {
          const payload = await body(req)
          const root = await requireRoot(ctx, payload.root)
          if (typeof payload.command !== 'string' || !payload.command.trim()) throw new Error('command is required')
          if (payload.command.length > 16_000) throw new Error('command is too long')
          return json(res, 200, await run(payload.command, root))
        }
        if (req.method === 'POST' && endpoint === 'terminal/start') {
          const payload = await body(req)
          const root = await requireRoot(ctx, payload.root)
          const terminal = await createTerminal(ctx, terminalSessions, root)
          return json(res, 200, { id: terminal.id, pid: terminal.handle.pid, sequence: 0 })
        }
        if (req.method === 'GET' && endpoint === 'terminal/poll') {
          const terminal = requireTerminal(terminalSessions, url.searchParams.get('id'))
          const after = Math.max(0, Number(url.searchParams.get('after') || '0') || 0)
          const chunks = terminal.chunks.filter(chunk => chunk.sequence > after)
          return json(res, 200, {
            chunks,
            sequence: chunks.at(-1)?.sequence ?? after,
            truncated: terminal.chunks.length > 0 && after > 0 && after < terminal.chunks[0]!.sequence - 1,
            closed: terminal.closed,
            outcome: terminal.outcome,
            error: terminal.error,
          })
        }
        if (req.method === 'POST' && endpoint === 'terminal/write') {
          const payload = await body(req)
          const terminal = requireTerminal(terminalSessions, payload.id)
          if (terminal.closed) throw new Error('terminal session is closed')
          if (typeof payload.data !== 'string' || payload.data.length === 0) throw new Error('terminal input is required')
          if (Buffer.byteLength(payload.data, 'utf8') > 64 * 1024) throw new Error('terminal input is too large')
          await terminal.handle.write(payload.data)
          return json(res, 200, { ok: true })
        }
        if (req.method === 'POST' && endpoint === 'terminal/signal') {
          const payload = await body(req)
          const terminal = requireTerminal(terminalSessions, payload.id)
          if (payload.signal !== 'SIGINT' && payload.signal !== 'SIGTERM' && payload.signal !== 'SIGTSTP') {
            throw new Error('unsupported terminal signal')
          }
          await terminal.handle.signalForeground(payload.signal)
          return json(res, 200, { ok: true })
        }
        if (req.method === 'POST' && endpoint === 'terminal/close') {
          const payload = await body(req)
          const terminal = requireTerminal(terminalSessions, payload.id)
          terminalSessions.delete(terminal.id)
          await terminal.handle.terminate()
          terminal.closed = true
          return json(res, 200, { ok: true })
        }
        return json(res, 404, { error: 'not found' })
      } catch (error) {
        return json(res, 400, { error: error instanceof Error ? error.message : 'request failed' })
      }
    },
  }), 'tobewin-developer-workbench: local API')
}
