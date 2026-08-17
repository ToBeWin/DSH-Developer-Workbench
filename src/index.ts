import { spawn } from 'node:child_process'
import { realpath, readdir, readFile, stat } from 'node:fs/promises'
import { basename, extname, relative, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const name = 'tobewin-dsh-developer-workbench'
export const inject = ['webServer', 'workspaceRegistry']

// Stay under the GUI's documented API carrier. This preserves Electron's
// file:// fetch bridge while remaining a longer, plugin-owned web-server route.
const API_ROOT = '/api/tobewin/developer-workbench'
const MAX_FILE_BYTES = 512 * 1024
const MAX_OUTPUT_BYTES = 64 * 1024
const MAX_TREE_DEPTH = 5
const IGNORED = new Set(['.git', 'node_modules', '.DS_Store', 'dist', 'build', '.next', '.turbo', 'coverage'])

type ContextLike = {
  webServer: { register(route: { kind: 'prefix', path: string, handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
  workspaceRegistry: { list(): Array<{ path: string, title?: string, id?: string }> }
  effect(dispose: () => void, label: string): void
}

function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
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

export function apply(ctx: ContextLike): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_ROOT,
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://dsh.internal')
        const endpoint = url.pathname.slice(API_ROOT.length).replace(/^\//, '')
        if (req.method === 'GET' && endpoint === 'roots') return json(res, 200, { roots: registeredRoots(ctx) })
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
        return json(res, 404, { error: 'not found' })
      } catch (error) {
        return json(res, 400, { error: error instanceof Error ? error.message : 'request failed' })
      }
    },
  }), 'tobewin-developer-workbench: local API')
}
