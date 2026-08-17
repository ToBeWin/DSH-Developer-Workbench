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
  if (!await clickText(window, ['Developer Workbench', '开发工作台'])) throw new Error('Workbench launcher was not found');
  await delay(520);
  const initial = await window.webContents.executeJavaScript(`(() => ({ workbench: Boolean(document.querySelector('.tw-workbench')), roots: document.querySelectorAll('.tw-workbench-root option').length, panes: document.querySelectorAll('.tw-workbench-pane').length }))()`);
  if (!initial.workbench || initial.panes !== 3 || initial.roots < 1) {
    const image = await window.webContents.capturePage(); writeFileSync(`${output}.debug.png`, image.toPNG());
    const markup = await window.webContents.executeJavaScript('document.body.innerText');
    throw new Error(`Workbench did not render: ${JSON.stringify(initial)}\\n${markup.slice(-2400)}`);
  }
  if (!await clickText(window, ['Enable local terminal', '启用本机命令'])) throw new Error('Terminal enable action was not found');
  await delay(120);
  await window.webContents.executeJavaScript(`(() => { const field = document.querySelector('.tw-workbench-command'); const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; setter.call(field, 'printf dsh-workbench-ok'); field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await delay(400);
  const terminal = await window.webContents.executeJavaScript(`document.querySelector('.tw-workbench-output')?.textContent || ''`);
  if (!terminal.includes('dsh-workbench-ok')) throw new Error(`Terminal did not execute a user command: ${terminal}`);
  const image = await window.webContents.capturePage(); writeFileSync(output, image.toPNG());
  await window.destroy(); app.quit();
});
