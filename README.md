# DSH Developer Workbench / DSH 开发工作台

An independent developer-workbench plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): inspect the active project's files, preview a local web app or website, and run an explicitly enabled command console without leaving the conversation.

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供独立的开发工作台：在对话中查看已打开项目的文件和代码、预览本地 Web 应用或网页，并按需启用命令控制台。

## What it adds / 功能

- **Explorer & code viewer** — browse only Harness-registered workspaces and read text files directly in the workbench.
- **Embedded preview** — load an `http`/`https` development server or web URL beside the code. A website may block embedding through its own security headers; localhost previews normally work.
- **Opt-in command console** — commands run only after the user presses **Enable local terminal**. Its starting directory is the selected Harness workspace. Nothing is run automatically.
- **Codex-like compact workflow** — one drawer combines file hierarchy, preview/code tabs, and command output.
- **Chinese and English** — labels follow DeepSeek Harness’s current language.

- **文件树与代码查看** —— 仅浏览已在 Harness 中登记的工作区，并在工作台内只读打开文本文件。
- **内嵌预览** —— 在代码旁加载 `http`/`https` 开发服务器或网页。部分网站会以自身安全策略阻止内嵌；本地 localhost 预览通常可用。
- **按需命令控制台** —— 只有用户点击“启用本地命令”后才可执行。命令以所选 Harness 工作区为初始目录，插件不会自动执行任何命令。
- **紧凑开发流** —— 文件层级、代码/预览标签页和命令输出集中于同一个抽屉。
- **中英文适配** —— 菜单与交互文案跟随 DeepSeek Harness 当前语言。

## Install / 安装

```bash
npm install @tobewin/dsh-developer-workbench
```

Install it through DeepSeek Harness Plugin Market and restart Harness if requested. The **Developer Workbench / 开发工作台** entry appears at the bottom of the sidebar.

通过 DeepSeek Harness 插件市场安装；若系统提示，请重启 Harness。侧栏底部会出现 **开发工作台 / Developer Workbench** 入口。

## Safety and privacy / 安全与隐私

This plugin deliberately uses only public DSH seams: a sidebar slot, locale service, `webServer`, and `workspaceRegistry`. It never patches Harness source files or depends on private DOM structure.

The host API verifies that every requested root is a currently registered Harness workspace. File access is read-only and rejects traversal outside that root, binary files, and files larger than 512 KB. The terminal is a **user-controlled local shell**, not a security sandbox: it starts in the selected workspace but a command can still access whatever the current user account is allowed to access. Enable it only for projects you trust.

本插件只使用 DSH 的公开能力：侧栏插槽、语言服务、`webServer` 与 `workspaceRegistry`；不会修改 Harness 源码，也不依赖私有 DOM 结构。

宿主 API 会验证每个根目录都是当前已登记的 Harness 工作区。文件读取为只读，拒绝越界路径、二进制文件和大于 512 KB 的文件。终端是**用户主动开启的本机 Shell**，不是安全沙箱：它以选定工作区为初始目录，但命令仍可能访问当前系统账户有权限访问的内容。请只在信任的项目中启用。

## Development / 开发

```bash
pnpm install
pnpm check
pnpm build
```

The plugin source is standalone; no DeepSeek Harness repository files need to be changed.

插件源码完全独立，不需要改动 DeepSeek Harness 仓库中的任何文件。
