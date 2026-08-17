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

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1600, height: 980 });
  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) process.stderr.write(`[renderer] ${message}\n`);
  });
  await window.loadURL(url); await delay(900);
  await clickText(window, ['Continue', '继续']); await delay(300);
  const initialImage = await window.webContents.capturePage(); writeFileSync(`${output}.initial.png`, initialImage.toPNG());
  const openedExplorer = await window.webContents.executeJavaScript(`(() => { const trigger = document.querySelector('.tw-dock-header-tool[title="Explorer"], .tw-dock-header-tool[title="文件"]'); if (!trigger) return false; trigger.click(); return true; })()`);
  if (!openedExplorer) {
    const image = await window.webContents.capturePage(); writeFileSync(`${output}.header-debug.png`, image.toPNG());
    const markup = await window.webContents.executeJavaScript('document.body.innerText');
    throw new Error(`Workspace header workbench action was not found\\n${markup.slice(-4000)}`);
  }
  await delay(520);
  const initial = await window.webContents.executeJavaScript(`(() => ({ explorer: Boolean(document.querySelector('.tw-dock-explorer')), roots: document.querySelectorAll('.tw-dock-select option').length }))()`);
  if (!initial.explorer || initial.roots < 1) {
    const image = await window.webContents.capturePage(); writeFileSync(`${output}.debug.png`, image.toPNG());
    const markup = await window.webContents.executeJavaScript('document.body.innerText');
    throw new Error(`Workbench did not render: ${JSON.stringify(initial)}\\n${markup.slice(-2400)}`);
  }
  const selectedReadme = await window.webContents.executeJavaScript(`(() => { const file = [...document.querySelectorAll('.tw-dock-tree button')].find((node) => node.textContent.includes('README.md')); if (!file) return false; file.click(); return true; })()`);
  if (!selectedReadme) throw new Error('A workspace file could not be selected');
  await delay(500);
  const code = await window.webContents.executeJavaScript(`document.querySelector('.tw-dock-code')?.textContent || ''`);
  if (!code.trim()) {
    const image = await window.webContents.capturePage(); writeFileSync(`${output}.code-debug.png`, image.toPNG());
    throw new Error('Selected file did not load into the code viewer');
  }
  const openedPreview = await window.webContents.executeJavaScript(`(() => { const button = document.querySelector('.tw-dock-header-tool[title="预览"], .tw-dock-header-tool[title="Preview"]'); if (!button) return false; button.click(); return true; })()`);
  if (!openedPreview) throw new Error('Preview action was not found');
  await window.webContents.executeJavaScript(`(() => { const field = document.querySelector('.tw-dock-preview-controls input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(field, 'http://127.0.0.1:3098'); field.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  if (!await clickText(window, ['Load preview', '加载预览'])) throw new Error('Preview load action was not found');
  await delay(100);
  const preview = await window.webContents.executeJavaScript(`document.querySelector('.tw-dock-frame')?.src || ''`);
  if (!preview.includes('127.0.0.1:3098')) throw new Error(`Preview did not receive the requested URL: ${preview}`);
  if (!await clickText(window, ['Code', '代码'])) throw new Error('Code tab was not found');
  const openedTerminal = await window.webContents.executeJavaScript(`(() => { const button = document.querySelector('.tw-dock-header-tool[title="终端"], .tw-dock-header-tool[title="Terminal"]'); if (!button) return false; button.click(); return true; })()`);
  if (!openedTerminal || !await clickText(window, ['Enable local terminal', '启用本机命令'])) throw new Error('Terminal enable action was not found');
  await delay(120);
  await window.webContents.executeJavaScript(`(() => { const field = document.querySelector('.tw-dock-command'); const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; setter.call(field, 'printf dsh-workbench-ok'); field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await delay(400);
  const terminal = await window.webContents.executeJavaScript(`document.querySelector('.tw-dock-output')?.textContent || ''`);
  if (!terminal.includes('dsh-workbench-ok')) throw new Error(`Terminal did not execute a user command: ${terminal}`);
  const image = await window.webContents.capturePage(); writeFileSync(output, image.toPNG());
  await window.destroy(); app.quit();
});
