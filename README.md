<h1 align="center">DSH Developer Workbench · DSH 开发工作台</h1>

<p align="center">Files, live preview, and a real interactive terminal—without leaving the conversation.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tobewin/dsh-developer-workbench"><img src="https://img.shields.io/npm/v/@tobewin/dsh-developer-workbench?color=2563eb&label=npm" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-111827" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/terminal-interactive%20PTY-0f766e" alt="Interactive PTY terminal">
  <img src="https://img.shields.io/badge/source-independent-7c3aed" alt="Independent plugin">
</p>

<p align="center"><a href="#quick-start--快速开始">Quick start</a> · <a href="#what-it-adds--功能">功能</a> · <a href="https://github.com/ToBeWin/DSH-Plugin-Market">All ToBeWin plugins</a></p>

An independent developer-workbench plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): inspect the active project's files, preview a local web app or website, and use an interactive project terminal without leaving the conversation.

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供独立的开发工作台：在对话中查看已打开项目的文件和代码、预览本地 Web 应用或网页，并直接使用项目交互式终端。

## See it in Harness / 实际效果

<p align="center">
  <img src="docs/images/developer-workbench.png" alt="DSH Developer Workbench with a live web preview in the right-hand column" width="94%">
</p>

## What it adds / 功能

- **Explorer & code viewer** — browse only Harness-registered workspaces and read text files directly in the workbench.
- **Embedded preview** — load an `http`/`https` development server or web URL beside the code. Loopback development servers use a workspace-scoped local proxy so restrictive frame headers do not block the preview; external sites may still refuse embedding.
- **Interactive PTY terminal** — clicking **Terminal** starts a persistent shell in the selected Harness workspace. Type, paste, use shell history and completion, or send `Ctrl+C` directly in the same terminal surface; there is no separate command form.
- **Codex-like expanding workflow** — a compact utility group in the upper-right of a workspace conversation opens Preview as a real right-hand column and Terminal as a real bottom region. The conversation reflows instead of being covered. The lighter Explorer/code surface remains floating by design.
- **Chinese and English** — labels follow DeepSeek Harness’s current language.

- **文件树与代码查看** —— 仅浏览已在 Harness 中登记的工作区，并在工作台内只读打开文本文件。
- **内嵌预览** —— 在代码旁加载 `http`/`https` 开发服务器或网页。回环地址的开发服务器会通过工作区限定的本地代理加载，避免被禁止 iframe 的响应头拦截；外部网站仍可能拒绝内嵌。
- **交互式 PTY 终端** —— 点击“终端”后，会在所选 Harness 工作区中启动持续运行的 Shell。用户可直接输入、粘贴、使用历史记录和补全，也可发送 `Ctrl+C`；界面不再拆分命令输入框与响应区。
- **接近 Codex 的扩展式开发流** —— 工作区会话右上角的紧凑工具组会把预览展开为真正的右侧栏，把终端展开为真正的底部区域；主会话随之重排而不会被遮挡。较轻量的文件树与代码查看器按设计保留悬浮形态。
- **中英文适配** —— 菜单与交互文案跟随 DeepSeek Harness 当前语言。

## Quick start / 快速开始

```bash
dsh plugin --profile web add @tobewin/dsh-developer-workbench
```

Install it through DeepSeek Harness Plugin Market and restart Harness if requested. Open a conversation attached to a workspace: its upper-right utilities contain the compact **Developer Workbench / 开发工作台** controls. They are intentionally absent from temporary and other no-workspace conversations.

通过 DeepSeek Harness 插件市场安装；若系统提示，请重启 Harness。打开一个已关联工作区的会话后，右上角会显示紧凑的 **开发工作台 / Developer Workbench** 控件；临时会话及其他未关联工作区的会话不会显示该入口。

## Safety and privacy / 安全与隐私

This plugin deliberately uses only public DSH seams: session-header and input-dock slots, the public right-details layout controller, locale service, `webServer`, `workspaceRegistry`, and the host `subprocess.spawnTerminal` PTY service. It never patches Harness source files or depends on private DOM structure.

The host API verifies that every requested root is a currently registered Harness workspace. File access is read-only and rejects traversal outside that root, binary files, and files larger than 512 KB. The terminal is a **user-controlled local shell**, not a security sandbox: it starts only after the user opens Terminal, in the selected workspace, but a command can still access whatever the current user account is allowed to access. Open it only for projects you trust.

本插件只使用 DSH 的公开能力：会话标题栏与输入区插槽、公开的右侧详情栏布局控制器、语言服务、`webServer`、`workspaceRegistry` 与宿主的 `subprocess.spawnTerminal` PTY 服务；不会修改 Harness 源码，也不依赖私有 DOM 结构。

宿主 API 会验证每个根目录都是当前已登记的 Harness 工作区。文件读取为只读，拒绝越界路径、二进制文件和大于 512 KB 的文件。终端是**用户主动开启的本机 Shell**，不是安全沙箱：仅在用户打开终端后启动，并以选定工作区为初始目录，但命令仍可能访问当前系统账户有权限访问的内容。请只在信任的项目中打开。

## Development / 开发

```bash
pnpm install
pnpm check
pnpm build
```

The plugin source is standalone; no DeepSeek Harness repository files need to be changed.

插件源码完全独立，不需要改动 DeepSeek Harness 仓库中的任何文件。
