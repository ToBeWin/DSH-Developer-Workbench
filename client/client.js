window.__ModuleLoader__.load({
  id: '@tobewin/dsh-developer-workbench',
  factory: (require) => {
    const React = require('react');
    const { createPortal } = require('react-dom');
    const h = React.createElement;
    const NS = 'settings.tobewinDeveloperWorkbench';
    const API = '/api/tobewin/developer-workbench';
    const inject = ['slots', 'locale'];

    const zh = {
      title: '开发工作台', workbench: '开发工作台', launch: '打开开发工作台', close: '关闭', refresh: '刷新', explorer: '文件', roots: '工作区',
      noRoots: '请先在 Harness 中打开一个工作区。', empty: '没有可显示的文件', selectFile: '从左侧选择一个文件', code: '代码', preview: '预览',
      url: '输入网页或本地开发服务器地址', load: '加载', noPreview: '输入地址并加载预览', previewHint: '嵌入预览可能被网站安全策略阻止；本地开发服务器通常可用。',
      terminal: '终端', terminalEnable: '启用本机命令', terminalEnabled: '本机命令已启用', terminalHint: '命令将在所选工作区作为初始目录运行。不会自动执行，也不构成系统隔离。',
      command: '输入命令后按 Enter 运行（Shift + Enter 换行）', run: '运行', running: '正在运行…', clear: '清空输出', commandReady: '命令控制台已就绪。', exit: '退出码', timeout: '超时已终止', copyPath: '复制路径', localOnly: '仅限本地工作区', error: '发生错误',
    };
    const en = {
      title: 'Developer Workbench', workbench: 'Developer Workbench', launch: 'Open Developer Workbench', close: 'Close', refresh: 'Refresh', explorer: 'Explorer', roots: 'Workspace',
      noRoots: 'Open a workspace in Harness first.', empty: 'No files to display', selectFile: 'Select a file from the explorer', code: 'Code', preview: 'Preview',
      url: 'Enter a web or local dev-server URL', load: 'Load', noPreview: 'Enter a URL and load the preview', previewHint: 'Embedded previews can be blocked by a site security policy; local development servers usually work.',
      terminal: 'Terminal', terminalEnable: 'Enable local terminal', terminalEnabled: 'Local terminal enabled', terminalHint: 'Commands run with the selected workspace as their initial directory. Nothing runs automatically and this is not a system sandbox.',
      command: 'Type a command and press Enter to run (Shift + Enter for a new line)', run: 'Run', running: 'Running…', clear: 'Clear output', commandReady: 'Command console ready.', exit: 'Exit', timeout: 'Stopped after timeout', copyPath: 'Copy path', localOnly: 'Local workspaces only', error: 'Something went wrong',
    };

    function installStyles() {
      if (document.getElementById('tobewin-developer-workbench-style')) return;
      const style = document.createElement('style');
      style.id = 'tobewin-developer-workbench-style';
      style.textContent = `
        .tw-workbench-trigger,.tw-workbench-button{font:inherit;cursor:pointer}.tw-workbench-trigger{display:flex;width:100%;align-items:center;gap:9px;border:0;border-radius:8px;padding:9px;background:transparent;color:var(--dsw-alias-label-primary)}.tw-workbench-trigger:hover{background:var(--dsw-alias-state-hover)}.tw-workbench-mark{display:grid;width:19px;height:19px;place-items:center;border:1.5px solid currentColor;border-radius:5px;font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace}.tw-workbench-shade{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.42)}.tw-workbench{position:fixed;z-index:91;right:18px;bottom:18px;left:18px;display:flex;min-height:430px;max-height:min(650px,calc(100vh - 36px));flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 28px 70px rgba(0,0,0,.34)}.tw-workbench-header{display:flex;min-height:54px;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.tw-workbench-title{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:650}.tw-workbench-subtitle,.tw-workbench-muted{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}.tw-workbench-actions{display:flex;gap:8px}.tw-workbench-button{border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:6px 10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px}.tw-workbench-button:hover{background:var(--dsw-alias-state-hover)}.tw-workbench-button[data-primary=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:#fff}.tw-workbench-button:disabled{opacity:.55;cursor:default}.tw-workbench-content{display:grid;min-height:0;flex:1;grid-template-columns:minmax(190px,240px) minmax(320px,1fr) minmax(310px,.72fr)}.tw-workbench-pane{min-width:0;min-height:0;overflow:auto;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}.tw-workbench-pane:last-child{border-right:0}.tw-workbench-head{display:flex;min-height:44px;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}.tw-workbench-body{padding:10px}.tw-workbench-root,.tw-workbench-input{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:7px 9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}.tw-workbench-tree{margin-top:10px}.tw-workbench-tree button{display:flex;width:100%;align-items:center;gap:6px;overflow:hidden;border:0;border-radius:5px;padding:5px 7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;cursor:pointer}.tw-workbench-tree button:hover,.tw-workbench-tree button[data-active=true]{background:var(--dsw-alias-state-hover);color:var(--dsw-alias-label-primary)}.tw-workbench-tree-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tw-workbench-tabs{display:flex;gap:5px}.tw-workbench-tab{border:0;border-bottom:2px solid transparent;padding:13px 4px 10px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}.tw-workbench-tab[data-active=true]{border-bottom-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}.tw-workbench-code,.tw-workbench-output{box-sizing:border-box;min-height:100%;margin:0;padding:14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;tab-size:2}.tw-workbench-empty{display:grid;min-height:190px;place-items:center;padding:18px;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center}.tw-workbench-preview-controls{display:flex;gap:7px;padding:10px;border-bottom:1px solid var(--dsw-alias-border-l1)}.tw-workbench-frame{display:block;width:100%;height:calc(100% - 56px);min-height:310px;border:0;background:#fff}.tw-workbench-hint{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.tw-workbench-terminal{display:flex;min-height:0;height:calc(100% - 45px);flex-direction:column;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 92%,#101010)}.tw-workbench-output{min-height:0;flex:1;overflow:auto}.tw-workbench-commandbar{display:flex;gap:7px;padding:10px;border-top:1px solid var(--dsw-alias-border-l1)}.tw-workbench-command{min-height:33px;resize:vertical}.tw-workbench-notice{margin:10px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 38%,var(--dsw-alias-border-l1));border-radius:8px;padding:10px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.tw-workbench-notice strong{display:block;margin-bottom:5px;color:var(--dsw-alias-label-primary)}.tw-workbench-status{padding:0 12px 10px;color:var(--dsw-alias-label-secondary);font-size:11px}.tw-workbench-error{color:var(--dsw-alias-state-danger)}@media(max-width:1080px){.tw-workbench{top:54px;right:10px;bottom:10px;left:10px;max-height:none}.tw-workbench-content{grid-template-columns:200px minmax(0,1fr);grid-template-rows:minmax(250px,1fr) 215px}.tw-workbench-pane:nth-child(2){border-right:0}.tw-workbench-pane:last-child{grid-column:1/-1;border-top:1px solid var(--dsw-alias-border-l1)}}@media(max-width:660px){.tw-workbench{top:10px}.tw-workbench-content{display:flex;flex-direction:column;overflow:auto}.tw-workbench-pane{min-height:250px;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}.tw-workbench-subtitle{display:none}}
      `;
      document.head.appendChild(style);
    }

    function Button({ children, primary, ...props }) {
      return h('button', { ...props, className: 'tw-workbench-button', 'data-primary': primary ? 'true' : undefined }, children);
    }
    async function request(path, options) {
      const response = await fetch(`${API}/${path}`, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    }
    function Tree({ items, depth, selected, onSelect }) {
      return h(React.Fragment, null, items.map((item) => h(React.Fragment, { key: item.path || item.name },
        h('button', { type: 'button', title: item.path || item.name, 'data-active': selected === item.path ? 'true' : undefined, style: { paddingLeft: `${7 + depth * 12}px` }, onClick: () => item.kind === 'file' && onSelect(item) },
          h('span', null, item.kind === 'directory' ? '⌄' : '·'), h('span', { className: 'tw-workbench-tree-name' }, item.name)),
        item.kind === 'directory' && item.children && item.children.length ? h(Tree, { items: item.children, depth: depth + 1, selected, onSelect }) : null
      )));
    }
    function Workbench({ locale, onClose }) {
      const t = locale.bind(NS);
      React.useSyncExternalStore(locale.subscribe.bind(locale), locale.getSnapshot.bind(locale), locale.getSnapshot.bind(locale));
      const [roots, setRoots] = React.useState([]); const [root, setRoot] = React.useState(''); const [tree, setTree] = React.useState([]); const [file, setFile] = React.useState(null);
      const [tab, setTab] = React.useState('code'); const [url, setUrl] = React.useState('http://127.0.0.1:3000'); const [preview, setPreview] = React.useState('');
      const [terminalEnabled, setTerminalEnabled] = React.useState(false); const [command, setCommand] = React.useState(''); const [logs, setLogs] = React.useState([]); const [running, setRunning] = React.useState(false); const [error, setError] = React.useState('');
      const loadRoots = React.useCallback(async () => { try { const data = await request('roots'); setRoots(data.roots); setRoot((current) => data.roots.some((item) => item.path === current) ? current : (data.roots[0] ? data.roots[0].path : '')); } catch (cause) { setError(cause.message); } }, []);
      const loadTree = React.useCallback(async () => { if (!root) return; try { setError(''); const data = await request(`tree?root=${encodeURIComponent(root)}`); setTree(data.items); } catch (cause) { setError(cause.message); } }, [root]);
      React.useEffect(() => { loadRoots(); }, [loadRoots]); React.useEffect(() => { loadTree(); }, [loadTree]);
      const openFile = async (item) => { try { setTab('code'); const data = await request(`file?root=${encodeURIComponent(root)}&path=${encodeURIComponent(item.path)}`); setFile(data); } catch (cause) { setError(cause.message); } };
      const runCommand = async () => { if (!terminalEnabled || !command.trim() || running || !root) return; const sent = command; setRunning(true); setCommand(''); setLogs((rows) => rows.concat({ command: sent, output: t('running') })); try { const data = await request('command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ root, command: sent }) }); setLogs((rows) => rows.slice(0, -1).concat({ command: sent, output: data.output, code: data.code, timedOut: data.timedOut })); } catch (cause) { setLogs((rows) => rows.slice(0, -1).concat({ command: sent, output: cause.message, error: true })); } finally { setRunning(false); } };
      const explorer = h('aside', { className: 'tw-workbench-pane' }, h('div', { className: 'tw-workbench-head' }, t('explorer')), h('div', { className: 'tw-workbench-body' }, roots.length ? h(React.Fragment, null,
        h('select', { className: 'tw-workbench-root', value: root, onChange: (event) => { setRoot(event.target.value); setFile(null); } }, roots.map((item) => h('option', { key: item.path, value: item.path }, item.title))),
        h('div', { className: 'tw-workbench-tree' }, tree.length ? h(Tree, { items: tree, depth: 0, selected: file && file.path, onSelect: openFile }) : h('div', { className: 'tw-workbench-hint' }, t('empty')))
      ) : h('div', { className: 'tw-workbench-empty' }, t('noRoots'))));
      const center = h('main', { className: 'tw-workbench-pane' }, h('div', { className: 'tw-workbench-head' }, h('div', { className: 'tw-workbench-tabs' }, ['code', 'preview'].map((key) => h('button', { key, type: 'button', className: 'tw-workbench-tab', 'data-active': tab === key ? 'true' : undefined, onClick: () => setTab(key) }, t(key)))), file && file.path ? h(Button, { onClick: () => navigator.clipboard && navigator.clipboard.writeText(file.path), title: t('copyPath') }, t('copyPath')) : null),
        tab === 'code' ? (file ? h('pre', { className: 'tw-workbench-code' }, file.content) : h('div', { className: 'tw-workbench-empty' }, t('selectFile'))) : h(React.Fragment, null,
          h('div', { className: 'tw-workbench-preview-controls' }, h('input', { className: 'tw-workbench-input', value: url, onChange: (event) => setUrl(event.target.value), onKeyDown: (event) => { if (event.key === 'Enter') setPreview(url); }, placeholder: t('url') }), h(Button, { primary: true, onClick: () => setPreview(url) }, t('load'))),
          preview ? h('iframe', { className: 'tw-workbench-frame', title: 'Developer preview', src: preview, sandbox: 'allow-forms allow-modals allow-popups allow-same-origin allow-scripts' }) : h('div', { className: 'tw-workbench-empty' }, h('div', null, h('div', null, t('noPreview')), h('p', { className: 'tw-workbench-hint' }, t('previewHint'))))
        ));
      const terminal = h('section', { className: 'tw-workbench-pane' }, h('div', { className: 'tw-workbench-head' }, t('terminal')), terminalEnabled ? h('div', { className: 'tw-workbench-terminal' },
        h('pre', { className: 'tw-workbench-output' }, logs.length ? logs.map((row, index) => h('div', { key: index, className: row.error ? 'tw-workbench-error' : undefined }, `$ ${row.command}\n${row.output}${row.code !== undefined ? `\n${t('exit')}: ${row.code}${row.timedOut ? ` · ${t('timeout')}` : ''}` : ''}\n`)) : t('commandReady')),
        h('div', { className: 'tw-workbench-commandbar' }, h('textarea', { className: 'tw-workbench-input tw-workbench-command', value: command, disabled: running, placeholder: t('command'), onChange: (event) => setCommand(event.target.value), onKeyDown: (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); runCommand(); } } }), h(Button, { primary: true, disabled: !command.trim() || running, onClick: runCommand }, running ? t('running') : t('run'))),
        h('div', { className: 'tw-workbench-status' }, h(Button, { onClick: () => setLogs([]) }, t('clear')))
      ) : h('div', { className: 'tw-workbench-empty' }, h('div', null, h('div', { className: 'tw-workbench-notice' }, h('strong', null, t('terminalEnable')), t('terminalHint')), h(Button, { primary: true, onClick: () => setTerminalEnabled(true) }, t('terminalEnable')))));
      return h(React.Fragment, null,
        h('div', { className: 'tw-workbench-shade', onMouseDown: onClose }),
        h('section', { className: 'tw-workbench', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('title') },
          h('header', { className: 'tw-workbench-header' }, h('div', { className: 'tw-workbench-title' }, h('span', { className: 'tw-workbench-mark' }, '>_'), h('span', null, t('title')), h('span', { className: 'tw-workbench-subtitle' }, t('localOnly'))), h('div', { className: 'tw-workbench-actions' }, h(Button, { onClick: loadTree }, t('refresh')), h(Button, { onClick: onClose, title: t('close') }, '×'))),
          h('div', { className: 'tw-workbench-content' }, explorer, center, terminal), error ? h('div', { className: 'tw-workbench-status tw-workbench-error' }, error) : null
        )
      );
    }
    function WorkbenchAction({ locale }) {
      const [open, setOpen] = React.useState(false); const t = locale.bind(NS);
      React.useSyncExternalStore(locale.subscribe.bind(locale), locale.getSnapshot.bind(locale), locale.getSnapshot.bind(locale));
      return h(React.Fragment, null, h('button', { type: 'button', className: 'tw-workbench-trigger', title: t('launch'), onClick: () => setOpen(true) }, h('span', { className: 'tw-workbench-mark' }, '>_'), h('span', null, t('workbench'))), open ? createPortal(h(Workbench, { locale, onClose: () => setOpen(false) }), document.body) : null);
    }
    function apply(ctx) {
      installStyles();
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'tobewin-developer-workbench: dictionaries');
      ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'tobewin-developer-workbench', order: 12, label: () => ctx.locale.bind(NS)('title'), locale: NS, inject: () => ({ locale: ctx.locale }) }, WorkbenchAction));
    }
    return { NS, apply, inject };
  },
});
