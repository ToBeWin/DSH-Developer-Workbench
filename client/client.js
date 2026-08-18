window.__ModuleLoader__.load({
  id: '@tobewin/dsh-developer-workbench',
  factory: (require) => {
    const React = require('react');
    const { createPortal } = require('react-dom');
    const h = React.createElement;
    const NS = 'settings.tobewinDeveloperWorkbench';
    const API = '/api/tobewin/developer-workbench';
    const inject = ['slots', 'locale', 'layout'];

    const zh = {
      title: '开发工作台', explorer: '文件', preview: '预览', code: '代码', terminal: '终端', refresh: '刷新', close: '关闭', maximize: '全屏预览', restore: '退出全屏',
      noRoots: '请先在 Harness 中打开一个工作区。', empty: '没有可显示的文件', selectFile: '从文件树选择一个文件',
      url: '输入网页或本地开发服务器地址', load: '加载预览', noPreview: '输入地址并加载预览',
      previewHint: '本地开发服务器会通过仅限回环地址的安全代理加载；部分外部网站可能禁止嵌入。', previewLocal: '支持 localhost 和 127.0.0.1', terminalHint: '直接输入命令；支持粘贴、方向键、Tab、Ctrl+C 和 Ctrl+L。',
      connecting: '正在连接终端…', terminalReady: '终端已连接', terminalClosed: '终端已关闭', clear: '清屏',
      localOnly: '本地工作区', copyPath: '复制路径',
    };
    const en = {
      title: 'Developer Workbench', explorer: 'Files', preview: 'Preview', code: 'Code', terminal: 'Terminal', refresh: 'Refresh', close: 'Close', maximize: 'Maximize preview', restore: 'Exit full screen',
      noRoots: 'Open a workspace in Harness first.', empty: 'No files to display', selectFile: 'Select a file from the explorer',
      url: 'Enter a web or local dev-server URL', load: 'Load preview', noPreview: 'Enter a URL and load the preview',
      previewHint: 'Local development servers load through a loopback-only proxy. Some external sites may prohibit embedding.', previewLocal: 'Works with localhost and 127.0.0.1', terminalHint: 'Type directly. Paste, arrow keys, Tab, Ctrl+C, and Ctrl+L are supported.',
      connecting: 'Connecting terminal…', terminalReady: 'Terminal connected', terminalClosed: 'Terminal closed', clear: 'Clear',
      localOnly: 'Local workspace', copyPath: 'Copy path',
    };

    function installStyles() {
      if (document.getElementById('tobewin-developer-workbench-style')) return;
      const style = document.createElement('style');
      style.id = 'tobewin-developer-workbench-style';
      style.textContent = `
        .tw-workbench-tools,.tw-workbench-tool,.tw-workbench-button{font:inherit}.tw-workbench-tools{display:flex;align-items:center;gap:4px}.tw-workbench-tool{display:grid;width:34px;height:34px;place-items:center;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}.tw-workbench-tool:hover,.tw-workbench-tool[data-active=true]{background:var(--dsw-alias-state-hover);color:var(--dsw-alias-brand-primary)}.tw-workbench-tool svg{width:19px;height:19px}
        .tw-files-layer{position:fixed!important;z-index:45!important;inset:0!important;width:auto!important;height:auto!important;pointer-events:none;color:var(--dsw-alias-label-primary)}.tw-files-panel{position:absolute;top:72px;right:18px;bottom:18px;display:flex;min-width:0;min-height:0;flex-direction:column;overflow:hidden;pointer-events:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 18px 42px rgba(0,0,0,.23)}.tw-files-explorer{width:270px}.tw-files-code{right:300px;width:min(520px,calc(100vw - 640px));min-width:340px}
        .tw-workbench-header{display:flex;min-height:44px;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}.tw-workbench-heading{display:flex;align-items:center;gap:8px;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.tw-workbench-heading span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tw-workbench-heading svg{width:17px;height:17px;flex:none}.tw-workbench-actions{display:flex;align-items:center;gap:6px;flex:none}.tw-workbench-button{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:6px 10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;line-height:16px;cursor:pointer}.tw-workbench-button:hover{background:var(--dsw-alias-state-hover)}.tw-workbench-button[data-primary=true]{border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}.tw-workbench-button:disabled{opacity:.55;cursor:default}.tw-workbench-close{display:grid;width:28px;height:28px;place-items:center;padding:0;border:0;background:transparent;font-size:20px}
        .tw-workbench-select,.tw-workbench-input{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}.tw-workbench-select{margin:10px;width:calc(100% - 20px)}.tw-files-tree{flex:1;overflow:auto;padding:0 8px 10px}.tw-files-tree button{display:flex;width:100%;align-items:center;gap:6px;overflow:hidden;border:0;border-radius:6px;padding:6px 7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;cursor:pointer}.tw-files-tree button:hover,.tw-files-tree button[data-active=true]{background:var(--dsw-alias-state-hover);color:var(--dsw-alias-label-primary)}.tw-files-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tw-workbench-code{box-sizing:border-box;min-height:0;flex:1;overflow:auto;margin:0;padding:13px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;tab-size:2}.tw-workbench-empty{display:grid;min-height:140px;flex:1;place-items:center;padding:18px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;text-align:center}.tw-workbench-error{color:var(--dsw-alias-state-danger)}
        .tw-preview-overlay-entry{position:absolute!important;inset:0!important;overflow:hidden;pointer-events:none!important}.tw-preview-details{position:absolute;z-index:4;top:0;right:0;bottom:0;display:flex;width:min(360px,38vw);min-width:0;min-height:0;flex-direction:column;overflow:hidden;pointer-events:auto;border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.tw-preview-details[data-fullscreen=true]{position:fixed!important;z-index:1000!important;inset:0!important;width:100vw!important;height:100vh!important;border-radius:0}.tw-preview-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 12px 12px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base)}.tw-preview-title{display:flex;min-width:0;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:20px}.tw-preview-title svg{width:16px;height:16px;flex:none}.tw-preview-header-actions{display:flex;align-items:center;gap:2px}.tw-preview-icon-button{display:grid;width:28px;height:28px;place-items:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary)}.tw-preview-icon-button:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-state-hover));color:var(--dsw-alias-label-primary)}.tw-preview-icon-button svg{width:16px;height:16px}.tw-preview-toolbar{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base)}.tw-preview-address{box-sizing:border-box;display:flex;height:36px;min-width:0;flex:1;align-items:center;gap:7px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);transition:border-color .15s ease,box-shadow .15s ease}.tw-preview-address:focus-within{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}.tw-preview-address svg{width:15px;height:15px;flex:none}.tw-preview-input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}.tw-preview-input::placeholder{color:var(--dsw-alias-label-tertiary)}.tw-preview-load{height:36px;min-width:64px;flex:none;padding:0 12px;white-space:nowrap}.tw-preview-frame{display:block;width:100%;min-height:0;flex:1;border:0;background:#fff}.tw-preview-empty{display:flex;min-height:0;flex:1;align-items:center;justify-content:center;padding:32px 26px;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,transparent),transparent 42%)}.tw-preview-empty-content{display:flex;max-width:272px;flex-direction:column;align-items:center;text-align:center}.tw-preview-empty-icon{display:grid;width:48px;height:48px;place-items:center;margin-bottom:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}.tw-preview-empty-icon svg{width:22px;height:22px}.tw-preview-empty-title{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.tw-preview-notice{margin:6px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px}.tw-preview-local{margin-top:14px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10px;line-height:16px}@media(prefers-reduced-motion:no-preference){.tw-preview-details{animation:tw-preview-enter .16s ease-out}@keyframes tw-preview-enter{from{opacity:.7;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}}
        .tw-terminal-dock{order:100;display:flex;width:calc(100% - 24px);height:min(360px,42vh);min-height:240px;align-self:center;flex:none;flex-direction:column;overflow:hidden;margin:0 12px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 12px 30px rgba(0,0,0,.14)}.tw-terminal-path{max-width:240px;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:400;text-overflow:ellipsis;white-space:nowrap}.tw-terminal-status{color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:400}.tw-terminal-screen{position:relative;min-height:0;flex:1;overflow:auto;padding:14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:text;outline:0}.tw-terminal-screen:focus,.tw-terminal-screen:focus-visible{outline:0;box-shadow:none}.tw-terminal-output{min-height:100%;margin:0;color:inherit;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;word-break:break-word;tab-size:4}.tw-terminal-cursor{display:inline-block;width:7px;height:14px;margin-left:1px;vertical-align:-2px;background:currentColor;animation:tw-terminal-blink 1s steps(1,end) infinite}.tw-terminal-help{position:absolute;right:12px;bottom:10px;max-width:58%;padding:4px 7px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 88%,transparent);color:var(--dsw-alias-label-tertiary);font-size:10px;pointer-events:none}@keyframes tw-terminal-blink{50%{opacity:0}}
        @media(max-width:1120px){.tw-files-code{right:300px;width:380px}}@media(max-width:820px){.tw-files-panel{top:62px;right:10px;bottom:10px;left:10px;width:auto;min-width:0}.tw-files-layer[data-code-open=true] .tw-files-explorer{display:none}.tw-terminal-dock{width:calc(100% - 16px);height:min(270px,42vh);margin-right:8px;margin-left:8px}}
      `;
      document.head.appendChild(style);
    }

    function Icon({ name }) {
      const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
      const paths = name === 'terminal'
        ? [h('path', { ...common, d: 'M4 5h16v14H4z' }), h('path', { ...common, d: 'm7 9 3 3-3 3M13 15h4' })]
        : name === 'files'
          ? [h('path', { ...common, d: 'M3.5 6.5h6l1.7 2h9.3v10H3.5z' }), h('path', { ...common, d: 'M3.5 8.5h17' })]
          : name === 'preview'
            ? [h('path', { ...common, d: 'M4 5h16v14H4z' }), h('path', { ...common, d: 'M4 9h16M8 7h.01M11 7h.01' })]
            : name === 'globe'
              ? [h('circle', { ...common, cx: 12, cy: 12, r: 8.5 }), h('path', { ...common, d: 'M3.8 12h16.4M12 3.5c2.1 2.3 3.1 5.1 3.1 8.5S14.1 18.2 12 20.5M12 3.5C9.9 5.8 8.9 8.6 8.9 12s1 6.2 3.1 8.5' })]
            : name === 'maximize'
              ? [h('path', { ...common, d: 'M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5' })]
              : name === 'restore'
                ? [h('path', { ...common, d: 'M9 9H4V4M15 9h5V4M20 15v5h-5M4 15v5h5' })]
            : [h('path', { ...common, d: 'M5 5l14 14M19 5 5 19' })];
      return h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, paths);
    }

    function Button({ children, primary, className, ...props }) {
      return h('button', { ...props, className: `tw-workbench-button ${className || ''}`, 'data-primary': primary ? 'true' : undefined }, children);
    }

    function useLocale(locale) {
      React.useSyncExternalStore(locale.subscribe.bind(locale), locale.getSnapshot.bind(locale), locale.getSnapshot.bind(locale));
      return locale.bind(NS);
    }

    function makeStore(layout) {
      let state = { explorer: false, code: false, preview: false, terminal: false, previewInput: '', previewUrl: '' };
      const listeners = new Set();
      const emit = () => listeners.forEach((listener) => listener());
      return {
        getSnapshot: () => state,
        subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
        set: (patch) => {
          const previewChanged = Object.prototype.hasOwnProperty.call(patch, 'preview') && patch.preview !== state.preview;
          state = { ...state, ...patch };
          if (previewChanged) patch.preview ? layout.openDetails() : layout.closeDetails();
          emit();
        },
        toggle: (key) => {
          const next = !state[key];
          state = { ...state, [key]: next };
          if (key === 'preview') next ? layout.openDetails() : layout.closeDetails();
          emit();
        },
      };
    }

    async function request(path, options) {
      const response = await fetch(`${API}/${path}`, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    }

    function previewStorageKey(workspaceKey) {
      return `tobewin-developer-workbench:preview:${workspaceKey || 'default'}`;
    }

    function readPreviewAddress(workspaceKey) {
      try { return window.localStorage.getItem(previewStorageKey(workspaceKey)) || ''; }
      catch { return ''; }
    }

    function savePreviewAddress(workspaceKey, address) {
      try { window.localStorage.setItem(previewStorageKey(workspaceKey), address); }
      catch { /* Local persistence is optional. */ }
    }

    function normalizePreviewAddress(input) {
      const address = input.trim();
      if (!address) return '';
      if (/^[a-z][a-z\d+.-]*:\/\//i.test(address)) return address;
      if (/^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(address)) return `http://${address}`;
      return `https://${address}`;
    }

    function previewToken(value) {
      const bytes = new TextEncoder().encode(value);
      let binary = '';
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function previewFrameAddress(address, workspaceKey) {
      try {
        const target = new URL(address);
        const hostname = target.hostname.toLowerCase();
        const loopback = hostname === 'localhost' || hostname === '::1' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
        if (!loopback || (target.protocol !== 'http:' && target.protocol !== 'https:')) return address;
        const rootToken = previewToken(workspaceKey);
        const originToken = previewToken(target.origin);
        const proxyOrigin = window.location.origin;
        return `${proxyOrigin}${API}/preview/${rootToken}/${originToken}${target.pathname}${target.search}${target.hash}`;
      } catch {
        return address;
      }
    }

    function terminalText(previous, incoming) {
      let current = previous;
      if (/\u001b\[(?:2|3)J/.test(incoming)) current = '';
      const clean = incoming
        .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, '')
        .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/\r\n/g, '\n');
      let lines = current.split('\n');
      let row = lines.length - 1;
      let column = lines[row].length;
      for (const character of clean) {
        if (character === '\r') { column = 0; continue; }
        if (character === '\n') { row += 1; lines[row] = ''; column = 0; continue; }
        if (character === '\b') { column = Math.max(0, column - 1); continue; }
        if (character === '\u0007' || character === '\u0000') continue;
        const line = lines[row] || '';
        lines[row] = line.slice(0, column) + character + line.slice(column + 1);
        column += character.length;
      }
      if (lines.length > 2_000) lines = lines.slice(-2_000);
      return lines.map((line) => line.replace(/\s+$/g, '')).join('\n');
    }

    function Tree({ items, depth, selected, onSelect }) {
      return h(React.Fragment, null, items.map((item) => h(React.Fragment, { key: item.path || item.name },
        h('button', { type: 'button', title: item.path || item.name, 'data-active': selected === item.path ? 'true' : undefined, style: { paddingLeft: `${7 + depth * 12}px` }, onClick: () => item.kind === 'file' && onSelect(item) },
          h('span', null, item.kind === 'directory' ? '⌄' : '·'), h('span', { className: 'tw-files-name' }, item.name)),
        item.kind === 'directory' && item.children && item.children.length ? h(Tree, { items: item.children, depth: depth + 1, selected, onSelect }) : null)));
    }

    function FloatingFilesLayer({ locale, store }) {
      const t = useLocale(locale);
      const dock = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const [roots, setRoots] = React.useState([]);
      const [root, setRoot] = React.useState('');
      const [tree, setTree] = React.useState([]);
      const [file, setFile] = React.useState(null);
      const [error, setError] = React.useState('');
      const loadRoots = React.useCallback(async () => {
        try {
          const data = await request('roots'); setRoots(data.roots);
          setRoot((value) => data.roots.some((entry) => entry.path === value) ? value : (data.roots[0] ? data.roots[0].path : ''));
        } catch (cause) { setError(cause.message); }
      }, []);
      const loadTree = React.useCallback(async () => {
        if (!root) return;
        try { const data = await request(`tree?root=${encodeURIComponent(root)}`); setTree(data.items); setError(''); }
        catch (cause) { setError(cause.message); }
      }, [root]);
      React.useEffect(() => { loadRoots(); }, [loadRoots]);
      React.useEffect(() => { loadTree(); }, [loadTree]);
      const openFile = async (item) => {
        try {
          const data = await request(`file?root=${encodeURIComponent(root)}&path=${encodeURIComponent(item.path)}`);
          setFile(data); store.set({ code: true }); setError('');
        } catch (cause) { setError(cause.message); }
      };
      if (!dock.explorer && !dock.code) return null;
      const explorer = dock.explorer ? h('aside', { className: 'tw-files-panel tw-files-explorer' },
        h('header', { className: 'tw-workbench-header' }, h('div', { className: 'tw-workbench-heading' }, h(Icon, { name: 'files' }), h('span', null, t('explorer'))),
          h('div', { className: 'tw-workbench-actions' }, h(Button, { onClick: loadTree }, t('refresh')), h(Button, { className: 'tw-workbench-close', onClick: () => store.set({ explorer: false }), title: t('close') }, '×'))),
        roots.length ? h(React.Fragment, null,
          h('select', { className: 'tw-workbench-select', value: root, onChange: (event) => { setRoot(event.target.value); setFile(null); store.set({ code: false }); } }, roots.map((entry) => h('option', { key: entry.path, value: entry.path }, entry.title))),
          h('div', { className: 'tw-files-tree' }, tree.length ? h(Tree, { items: tree, depth: 0, selected: file && file.path, onSelect: openFile }) : h('div', { className: 'tw-workbench-empty' }, t('empty'))))
          : h('div', { className: 'tw-workbench-empty' }, error || t('noRoots'))) : null;
      const code = dock.code ? h('section', { className: 'tw-files-panel tw-files-code' },
        h('header', { className: 'tw-workbench-header' }, h('div', { className: 'tw-workbench-heading' }, h('span', null, file ? file.path : t('code'))),
          h('div', { className: 'tw-workbench-actions' }, file && file.path ? h(Button, { onClick: () => navigator.clipboard && navigator.clipboard.writeText(file.path) }, t('copyPath')) : null, h(Button, { className: 'tw-workbench-close', onClick: () => store.set({ code: false }), title: t('close') }, '×'))),
        file ? h('pre', { className: 'tw-workbench-code' }, file.content) : h('div', { className: 'tw-workbench-empty' }, t('selectFile'))) : null;
      return h('div', { className: 'tw-files-layer', 'data-code-open': dock.code ? 'true' : undefined }, explorer, code);
    }

    function PreviewBody({ locale, store, workspaceKey }) {
      const t = useLocale(locale);
      const dock = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const [fullscreen, setFullscreen] = React.useState(false);
      React.useEffect(() => {
        store.set({ previewInput: readPreviewAddress(workspaceKey), previewUrl: '' });
      }, [store, workspaceKey]);
      React.useEffect(() => {
        if (!fullscreen) return undefined;
        const exit = (event) => {
          if (event.key === 'Escape') setFullscreen(false);
        };
        document.addEventListener('keydown', exit);
        return () => document.removeEventListener('keydown', exit);
      }, [fullscreen]);
      const load = () => {
        const address = normalizePreviewAddress(dock.previewInput);
        if (!address) return;
        savePreviewAddress(workspaceKey, address);
        store.set({ previewInput: address, previewUrl: address });
      };
      return h('section', { className: 'tw-preview-details', 'data-workbench-preview': 'details', 'data-fullscreen': fullscreen ? 'true' : undefined },
        h('header', { className: 'tw-preview-header' }, h('div', { className: 'tw-preview-title' }, h(Icon, { name: 'preview' }), h('span', null, t('preview'))),
          h('div', { className: 'tw-preview-header-actions' },
            h(Button, { className: 'tw-preview-icon-button', onClick: () => setFullscreen((value) => !value), title: fullscreen ? t('restore') : t('maximize'), 'aria-label': fullscreen ? t('restore') : t('maximize') }, h(Icon, { name: fullscreen ? 'restore' : 'maximize' })),
            h(Button, { className: 'tw-preview-icon-button', onClick: () => store.set({ preview: false }), title: t('close'), 'aria-label': t('close') }, h(Icon, { name: 'close' })))),
        h('div', { className: 'tw-preview-toolbar' },
          h('label', { className: 'tw-preview-address' }, h(Icon, { name: 'globe' }), h('input', { className: 'tw-preview-input', value: dock.previewInput, placeholder: t('url'), 'aria-label': t('url'), onChange: (event) => store.set({ previewInput: event.target.value }), onKeyDown: (event) => { if (event.key === 'Enter') load(); } })),
          h(Button, { className: 'tw-preview-load', primary: true, disabled: !dock.previewInput.trim(), onClick: load }, t('load'))),
        dock.previewUrl ? h('iframe', { className: 'tw-preview-frame', title: 'Developer preview', src: previewFrameAddress(dock.previewUrl, workspaceKey), sandbox: 'allow-forms allow-modals allow-popups allow-same-origin allow-scripts' })
          : h('div', { className: 'tw-preview-empty' }, h('div', { className: 'tw-preview-empty-content' },
            h('div', { className: 'tw-preview-empty-icon' }, h(Icon, { name: 'preview' })),
            h('div', { className: 'tw-preview-empty-title' }, t('noPreview')),
            h('p', { className: 'tw-preview-notice' }, t('previewHint')),
            h('div', { className: 'tw-preview-local' }, t('previewLocal')))));
    }

    function useWorkspaceMembership(useWorkspaces, sessionId) {
      return useWorkspaces((state) => Boolean(sessionId && state.items.some((workspace) => workspace.sessionIds.includes(sessionId))));
    }

    function useCloseOutsideWorkspace(inWorkspace, store) {
      React.useEffect(() => {
        if (!inWorkspace) store.set({ explorer: false, code: false, preview: false, terminal: false });
      }, [inWorkspace, store]);
    }

    function PreviewSidecar({ locale, layout, store, useSessions, useWorkspaces }) {
      const dock = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const sessionId = useSessions((state) => state.current);
      const session = useSessions((state) => sessionId ? state.byId[sessionId] : undefined);
      const inWorkspace = useWorkspaceMembership(useWorkspaces, sessionId);
      const available = Boolean(session && session.blank === false && session.cwd && inWorkspace);
      const shouldOpen = Boolean(dock.preview && available);

      React.useEffect(() => {
        if (!available && (dock.explorer || dock.code || dock.preview || dock.terminal)) {
          store.set({ explorer: false, code: false, preview: false, terminal: false });
        }
      }, [available, dock.code, dock.explorer, dock.preview, dock.terminal, store]);

      React.useLayoutEffect(() => {
        if (!shouldOpen) return undefined;
        layout.openDetails();
        const retry = requestAnimationFrame(() => layout.openDetails());
        return () => cancelAnimationFrame(retry);
      }, [layout, sessionId, shouldOpen]);

      return h('div', { className: 'tw-preview-overlay-entry', 'aria-hidden': shouldOpen ? undefined : 'true' },
        shouldOpen ? h(PreviewBody, { locale, store, workspaceKey: session.cwd }) : null);
    }

    function TerminalDock({ locale, store, sessionId, useSessions, useWorkspaces }) {
      const t = useLocale(locale);
      const dock = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const cwd = useSessions((state) => state.byId[sessionId] && state.byId[sessionId].cwd);
      const inWorkspace = useWorkspaceMembership(useWorkspaces, sessionId);
      const [output, setOutput] = React.useState('');
      const [status, setStatus] = React.useState('connecting');
      const terminalRef = React.useRef(null);
      const screenRef = React.useRef(null);
      const sequenceRef = React.useRef(0);
      const inputRef = React.useRef('');
      const flushRef = React.useRef(null);
      const writeChainRef = React.useRef(Promise.resolve());

      const flushInput = React.useCallback(() => {
        flushRef.current = null;
        const id = terminalRef.current;
        const data = inputRef.current;
        inputRef.current = '';
        if (!id || !data) return;
        writeChainRef.current = writeChainRef.current.then(() => request('terminal/write', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, data }),
        })).catch((cause) => setOutput((value) => terminalText(value, `\n${cause.message}\n`)));
      }, []);

      const send = React.useCallback((data) => {
        if (!terminalRef.current || status !== 'ready') return;
        inputRef.current += data;
        if (flushRef.current === null) flushRef.current = window.setTimeout(flushInput, 12);
      }, [flushInput, status]);

      React.useEffect(() => {
        if (!dock.terminal || !cwd || !inWorkspace) return undefined;
        let cancelled = false;
        let pollTimer;
        let openedId = '';
        setOutput(''); setStatus('connecting'); sequenceRef.current = 0;

        const poll = async () => {
          if (cancelled || !openedId) return;
          try {
            const data = await request(`terminal/poll?id=${encodeURIComponent(openedId)}&after=${sequenceRef.current}`);
            if (cancelled) return;
            if (data.truncated) setOutput((value) => terminalText(value, '\n[earlier terminal output was truncated]\n'));
            for (const chunk of data.chunks || []) setOutput((value) => terminalText(value, chunk.data));
            sequenceRef.current = data.sequence;
            if (data.error) setOutput((value) => terminalText(value, `\n${data.error}\n`));
            if (data.closed) { setStatus('closed'); return; }
          } catch (cause) {
            if (!cancelled) setOutput((value) => terminalText(value, `\n${cause.message}\n`));
          }
          pollTimer = window.setTimeout(poll, 80);
        };

        void request('terminal/start', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ root: cwd }),
        }).then((data) => {
          if (cancelled) {
            void request('terminal/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: data.id }) }).catch(() => {});
            return;
          }
          openedId = data.id; terminalRef.current = data.id; setStatus('ready'); void poll();
          window.setTimeout(() => screenRef.current && screenRef.current.focus(), 0);
        }).catch((cause) => { if (!cancelled) { setStatus('closed'); setOutput(cause.message); } });

        return () => {
          cancelled = true;
          if (pollTimer) window.clearTimeout(pollTimer);
          if (flushRef.current !== null) { window.clearTimeout(flushRef.current); flushRef.current = null; }
          inputRef.current = '';
          const id = terminalRef.current || openedId;
          terminalRef.current = null;
          if (id) void request('terminal/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {});
        };
      }, [dock.terminal, cwd, inWorkspace]);

      React.useEffect(() => {
        if (screenRef.current) screenRef.current.scrollTop = screenRef.current.scrollHeight;
      }, [output]);

      const key = (event) => {
        if (event.isComposing || status !== 'ready') return;
        let data = '';
        if (event.ctrlKey && !event.metaKey) {
          const letter = event.key.toLowerCase();
          if (letter >= 'a' && letter <= 'z') data = String.fromCharCode(letter.charCodeAt(0) - 96);
        } else if (!event.metaKey && !event.altKey && event.key.length === 1) data = event.key;
        else data = ({ Enter: '\n', Backspace: '\u007f', Tab: '\t', ArrowUp: '\u001b[A', ArrowDown: '\u001b[B', ArrowRight: '\u001b[C', ArrowLeft: '\u001b[D', Escape: '\u001b', Home: '\u001b[H', End: '\u001b[F', Delete: '\u001b[3~' })[event.key] || '';
        if (!data) return;
        event.preventDefault();
        if (event.ctrlKey && event.key.toLowerCase() === 'l') setOutput('');
        send(data);
      };

      if (!dock.terminal || !cwd || !inWorkspace) return null;
      return h('section', { className: 'tw-terminal-dock', 'data-workbench-terminal': 'docked' },
        h('header', { className: 'tw-workbench-header' }, h('div', { className: 'tw-workbench-heading' }, h(Icon, { name: 'terminal' }), h('span', null, t('terminal')), h('span', { className: 'tw-terminal-path', title: cwd }, cwd), h('span', { className: 'tw-terminal-status' }, status === 'ready' ? t('terminalReady') : status === 'closed' ? t('terminalClosed') : t('connecting'))),
          h('div', { className: 'tw-workbench-actions' }, h(Button, { disabled: status !== 'ready', onClick: () => { setOutput(''); send('\u000c'); screenRef.current && screenRef.current.focus(); } }, t('clear')), h(Button, { className: 'tw-workbench-close', onClick: () => store.set({ terminal: false }), title: t('close') }, '×'))),
        h('div', { ref: screenRef, className: 'tw-terminal-screen', role: 'textbox', 'aria-label': t('terminal'), 'aria-multiline': 'true', tabIndex: 0, onKeyDown: key, onPaste: (event) => { const text = event.clipboardData.getData('text'); if (text) { event.preventDefault(); send(text); } }, onClick: () => screenRef.current && screenRef.current.focus() },
          h('pre', { className: 'tw-terminal-output' }, output, status === 'ready' ? h('span', { className: 'tw-terminal-cursor', 'aria-hidden': 'true' }) : null),
          !output && status !== 'ready' ? h('div', { className: 'tw-terminal-help' }, status === 'closed' ? t('terminalClosed') : t('connecting')) : h('div', { className: 'tw-terminal-help' }, t('terminalHint'))));
    }

    function WorkbenchTools({ locale, store, className }) {
      const t = useLocale(locale);
      const dock = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const tools = [{ key: 'explorer', icon: 'files', title: t('explorer') }, { key: 'preview', icon: 'preview', title: t('preview') }, { key: 'terminal', icon: 'terminal', title: t('terminal') }];
      return h('div', { className, 'aria-label': t('title') }, tools.map((tool) => h('button', { key: tool.key, type: 'button', className: 'tw-workbench-tool tw-workbench-action', 'data-active': dock[tool.key] ? 'true' : undefined, title: tool.title, 'aria-label': tool.title, onClick: () => store.toggle(tool.key) }, h(Icon, { name: tool.icon }))));
    }

    function HeaderWorkbenchTools({ locale, store, sessionId, useSessions, useSession, useWorkspaces }) {
      const cwd = useSessions((state) => state.byId[sessionId] && state.byId[sessionId].cwd);
      const blank = useSession((session) => session.blank);
      const inWorkspace = useWorkspaceMembership(useWorkspaces, sessionId);
      useCloseOutsideWorkspace(inWorkspace, store);
      if (!cwd || blank || !inWorkspace) return null;
      return h(React.Fragment, null, h(WorkbenchTools, { locale, store, className: 'tw-workbench-tools' }), createPortal(h(FloatingFilesLayer, { locale, store }), document.body));
    }
    function apply(ctx) {
      installStyles();
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'tobewin-developer-workbench: dictionaries');
      const store = makeStore(ctx.layout);
      ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'tobewin-developer-workbench', order: 80, label: () => ctx.locale.bind(NS)('title'), locale: NS, inject: () => ({ locale: ctx.locale, store }) }, HeaderWorkbenchTools));
      ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({ name: 'conversation.input.dock', id: 'tobewin-developer-workbench-terminal', order: 92, label: () => ctx.locale.bind(NS)('terminal'), locale: NS, inject: () => ({ locale: ctx.locale, store }) }, TerminalDock));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'tobewin-developer-workbench-preview-sidecar', order: 20, label: () => ctx.locale.bind(NS)('preview'), locale: NS, inject: () => ({ locale: ctx.locale, layout: ctx.layout, store }) }, PreviewSidecar));
    }

    return { NS, apply, inject };
  },
});
