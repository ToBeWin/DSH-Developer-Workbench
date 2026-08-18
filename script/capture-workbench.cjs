const { app, BrowserWindow } = require('electron');
const { writeFileSync } = require('node:fs');

const [url, output] = process.argv.slice(2).filter((value) => value !== '--');
if (!url || !output) throw new Error('Usage: electron capture-workbench.cjs <url> <output.png>');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function clickText(window, labels) {
  return window.webContents.executeJavaScript(`(() => {
    const labels = ${JSON.stringify(labels)};
    const target = [...document.querySelectorAll('button, [role="button"]')]
      .find((node) => labels.some((label) => node.textContent.trim() === label || node.textContent.includes(label)));
    if (!target) return false;
    target.click();
    return true;
  })()`);
}

async function clickTool(window, titles) {
  return window.webContents.executeJavaScript(`(() => {
    const titles = ${JSON.stringify(titles)};
    const trigger = [...document.querySelectorAll('.tw-workbench-tool')]
      .find((node) => titles.includes(node.getAttribute('title')) || titles.includes(node.getAttribute('aria-label')));
    if (!trigger) return false;
    trigger.click();
    return true;
  })()`);
}

async function screenshot(window, path) {
  const image = await window.webContents.capturePage();
  writeFileSync(path, image.toPNG());
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1600, height: 980 });
  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) process.stderr.write(`[renderer] ${message}\n`);
  });

  await window.loadURL(url);
  await delay(1000);
  await clickText(window, ['Continue', '继续']);
  await delay(350);
  await screenshot(window, `${output}.initial.png`);

  // Make the run independent from whichever conversation the desktop app
  // persisted last. Pick an existing project session before asserting tools.
  const openedSession = await window.webContents.executeJavaScript(`(() => {
    const rows = [...document.querySelectorAll('[role="treeitem"][aria-selected]')];
    const ungrouped = [...document.querySelectorAll('[role="treeitem"][aria-expanded]')].find((node) => /Ungrouped|未分组/.test(node.textContent));
    const cutoff = ungrouped ? ungrouped.getBoundingClientRect().top : innerHeight;
    const row = rows.find((node) => !/New Session|新会话/.test(node.textContent) && node.getBoundingClientRect().top < cutoff);
    if (!row) return { opened: false, rows: rows.map((node) => ({ text: node.textContent, selected: node.getAttribute('aria-selected') })) };
    row.click();
    return { opened: true, text: row.textContent };
  })()`);
  if (!openedSession.opened) throw new Error(`Could not switch to an existing workspace session: ${JSON.stringify(openedSession)}`);
  await delay(650);

  const openedExplorer = await clickTool(window, ['Files', '文件']);
  if (!openedExplorer) {
    await screenshot(window, `${output}.header-debug.png`);
    const markup = await window.webContents.executeJavaScript('document.body.innerText');
    throw new Error(`Workspace header workbench action was not found\n${markup.slice(-4000)}`);
  }
  await delay(520);
  const initial = await window.webContents.executeJavaScript(`(() => ({
    explorer: Boolean(document.querySelector('.tw-files-explorer')),
    roots: document.querySelectorAll('.tw-workbench-select option').length,
    floating: getComputedStyle(document.querySelector('.tw-files-layer')).position === 'fixed',
    layerPosition: getComputedStyle(document.querySelector('.tw-files-layer')).position,
    panelPosition: getComputedStyle(document.querySelector('.tw-files-explorer')).position,
    panelRect: document.querySelector('.tw-files-explorer').getBoundingClientRect().toJSON()
  }))()`);
  if (!initial.explorer || initial.roots < 1 || !initial.floating || initial.panelRect.height < 200) {
    await screenshot(window, `${output}.files-debug.png`);
    throw new Error(`Floating file explorer did not render correctly: ${JSON.stringify(initial)}`);
  }
  process.stdout.write(`Explorer layout: ${JSON.stringify(initial)}\n`);

  const selectedReadme = await window.webContents.executeJavaScript(`(() => {
    const file = [...document.querySelectorAll('.tw-files-tree button')]
      .find((node) => node.textContent.includes('README.md'));
    if (!file) return false;
    file.click();
    return true;
  })()`);
  if (!selectedReadme) throw new Error('A workspace file could not be selected');
  await delay(500);
  const code = await window.webContents.executeJavaScript(`document.querySelector('.tw-workbench-code')?.textContent || ''`);
  if (!code.trim()) {
    await screenshot(window, `${output}.code-debug.png`);
    throw new Error('Selected file did not load into the floating code viewer');
  }
  await window.webContents.executeJavaScript(`document.querySelectorAll('.tw-workbench-close').forEach((node) => node.click())`);
  await delay(160);

  // Harness allocates an official right details column for persisted project
  // sessions. Preview must occupy that column and shrink the chat surface.
  const centerBefore = await window.webContents.executeJavaScript(`document.querySelector('[data-phase]')?.getBoundingClientRect().width || 0`);
  if (!await clickTool(window, ['Preview', '预览'])) throw new Error('Active-session preview action was not found');
  await delay(350);
  const details = await window.webContents.executeJavaScript(`(() => {
    const panel = document.querySelector('[data-workbench-preview="details"]');
    const center = document.querySelector('[data-phase]');
    if (!panel || !center) return null;
    const rect = panel.getBoundingClientRect();
    return {
      position: getComputedStyle(panel).position,
      width: rect.width,
      left: rect.left,
      centerWidth: center.getBoundingClientRect().width,
      viewportWidth: innerWidth
    };
  })()`);
  if (!details || ['fixed', 'absolute'].includes(details.position) || details.width < 260 || details.centerWidth >= centerBefore - 180) {
    await screenshot(window, `${output}.preview-details-debug.png`);
    throw new Error(`Preview did not expand into the official right column: before=${centerBefore}, after=${JSON.stringify(details)}`);
  }

  await window.webContents.executeJavaScript(`(() => {
    const field = document.querySelector('.tw-preview-controls input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(field, 'http://127.0.0.1:3098');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  if (!await clickText(window, ['Load preview', '加载预览'])) throw new Error('Preview load action was not found');
  await delay(180);
  const preview = await window.webContents.executeJavaScript(`document.querySelector('.tw-preview-frame')?.src || ''`);
  if (!preview.includes('127.0.0.1:3098')) throw new Error(`Preview did not receive the requested URL: ${preview}`);

  if (!await clickTool(window, ['Terminal', '终端'])) throw new Error('Terminal action was not found');
  await delay(180);
  const terminalLayout = await window.webContents.executeJavaScript(`(() => {
    const panel = document.querySelector('[data-workbench-terminal="docked"]');
    const composer = document.querySelector('[data-composer-seat]');
    if (!panel || !composer) return null;
    const rect = panel.getBoundingClientRect();
    const textareas = [...composer.querySelectorAll('textarea')].filter((node) => !node.classList.contains('tw-terminal-command'));
    const inputBottom = textareas.length ? Math.max(...textareas.map((node) => node.getBoundingClientRect().bottom)) : 0;
    return {
      position: getComputedStyle(panel).position,
      parented: composer.contains(panel),
      top: rect.top,
      inputBottom,
      width: rect.width
    };
  })()`);
  if (!terminalLayout || ['fixed', 'absolute'].includes(terminalLayout.position) || !terminalLayout.parented || terminalLayout.top < terminalLayout.inputBottom) {
    await screenshot(window, `${output}.terminal-layout-debug.png`);
    throw new Error(`Terminal is not a bottom expanded region: ${JSON.stringify(terminalLayout)}`);
  }
  await delay(520);
  const terminalSurface = await window.webContents.executeJavaScript(`(() => {
    const screen = document.querySelector('.tw-terminal-screen');
    return screen ? {
      role: screen.getAttribute('role'),
      focusable: screen.tabIndex === 0,
      separateInput: Boolean(document.querySelector('.tw-terminal-command, .tw-terminal-commandbar'))
    } : null;
  })()`);
  if (!terminalSurface || terminalSurface.role !== 'textbox' || !terminalSurface.focusable || terminalSurface.separateInput) {
    throw new Error(`Terminal is not a single interactive PTY surface: ${JSON.stringify(terminalSurface)}`);
  }
  await window.webContents.executeJavaScript(`(() => {
    const screen = document.querySelector('.tw-terminal-screen');
    screen.focus();
    for (const key of 'printf dsh-workbench-ok') {
      screen.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  })()`);
  await delay(850);
  const terminal = await window.webContents.executeJavaScript(`document.querySelector('.tw-terminal-output')?.textContent || ''`);
  if (!terminal.includes('dsh-workbench-ok')) throw new Error(`Terminal did not execute a user command: ${terminal}`);
  await window.webContents.executeJavaScript(`(() => {
    const screen = document.querySelector('.tw-terminal-screen');
    for (const key of 'sleep 5') screen.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  })()`);
  await delay(180);
  await window.webContents.executeJavaScript(`(() => {
    const screen = document.querySelector('.tw-terminal-screen');
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
    for (const key of 'printf dsh-interrupt-ok') screen.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  })()`);
  await delay(850);
  const interrupted = await window.webContents.executeJavaScript(`document.querySelector('.tw-terminal-output')?.textContent || ''`);
  if (!interrupted.includes('dsh-interrupt-ok')) throw new Error(`Terminal did not remain interactive after Ctrl+C: ${interrupted}`);

  await screenshot(window, output);
  window.setSize(1040, 780);
  await delay(300);
  await screenshot(window, `${output}.narrow.png`);
  const overflow = await window.webContents.executeJavaScript(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  if (overflow > 2) throw new Error(`Narrow layout creates ${overflow}px of horizontal overflow`);
  window.setSize(1600, 980);
  await delay(180);

  // Workbench controls are project capabilities. Moving to an ungrouped
  // session must remove the entry points and close every expanded surface.
  await window.webContents.executeJavaScript(`(() => {
    const group = [...document.querySelectorAll('[role="treeitem"][aria-expanded]')]
      .find((node) => /Ungrouped|未分组/.test(node.textContent));
    if (group?.getAttribute('aria-expanded') !== 'true') group?.click();
  })()`);
  await delay(180);
  const openedUngrouped = await window.webContents.executeJavaScript(`(() => {
    const group = [...document.querySelectorAll('[role="treeitem"][aria-expanded]')]
      .find((node) => /Ungrouped|未分组/.test(node.textContent));
    const row = [...(group?.parentElement?.querySelectorAll('[role="treeitem"][aria-selected]') || [])]
      .find((node) => node.getAttribute('aria-selected') !== 'true' && !/New Session|新会话/.test(node.textContent));
    if (!row) return false;
    row.click();
    return true;
  })()`);
  if (openedUngrouped) {
    await delay(420);
    const gated = await window.webContents.executeJavaScript(`({
      tools: document.querySelectorAll('.tw-workbench-tool').length,
      preview: Boolean(document.querySelector('[data-workbench-preview]')),
      terminal: Boolean(document.querySelector('[data-workbench-terminal]')),
      files: Boolean(document.querySelector('.tw-files-layer'))
    })`);
    if (gated.tools || gated.preview || gated.terminal || gated.files) {
      throw new Error(`Ungrouped session retained workspace-only tools: ${JSON.stringify(gated)}`);
    }
  }

  await window.destroy();
  app.quit();
});
