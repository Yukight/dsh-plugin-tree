# dsh-plugin-tree

> DeepSeek Harness（DSH）插件依赖 **DAG 可视化 + 运行时冲突检测**。在 设置 → 插件 中新增「插件树」页签，并以近全屏置顶窗口呈现力导向图谱。

[English](./README.md) · [MIT](./LICENSE)

```
- [dsh-plugin-tree](#dsh-plugin-tree) — 插件依赖 DAG 可视化 / 冲突检测 / 安装前影响面预览
```

## 特性

- **依赖 DAG 图谱**：力导向布局展示 Cordis Loader 组合树；实线 = 组合层级边，蓝色虚线箭头 = 运行时服务依赖边（consumer → provider）。
- **节点状态灯**：🟢 已挂载 · ⚪ 已停用 · 🟡 加载中 · 🔵 等待依赖 · 🔴 挂载失败 · 空心绿 = 已启用未挂载；缺失依赖加红圈。
- **冲突检测**：依赖缺失、挂载失败、等待依赖、slot 同 cell 遮蔽（⚠ 问题卡，可点击定位到节点）。
- **安装前影响面预览**：输入候选插件的 `inject` 服务与拟注册槽位（`name` 或 `name#id`），实时评估 缺失 / 提供者 / 遮蔽，并在图中高亮注入点。
- **分层过滤**：用户 / 功能 / 基础设施 / 框架（默认隐藏框架层）。
- **动态插件可见**：进程内动态 Cordis 插件（非 Loader 条目）以「动态插件」合成节点显示。
- **交互**：滚轮缩放、拖拽平移、拖动节点、悬停信息卡、点击详情面板（条目 ID / 模块路径 / 显示名 / 父节点 / 状态 / 配置字段 / 出入边跳转）。

## 安装

方式一：profile 本地链接（推荐开发期）

```jsonc
// <profile>/package.json
"dependencies": { "dsh-plugin-tree": "file:<本仓库绝对路径>" }
```

```yaml
# <profile>/cordis.patch.yml（合并本仓库 cordis.patch.yml 内容）
- insert:
    - id: plugin-tree
      name: dsh-plugin-tree
```

方式二：npm 安装

```bash
pnpm add dsh-plugin-tree
```

随后把 `cordis.patch.yml` 的 insert 行加入 profile patch，重启 DSH。浏览器半经 `package.json` 的 `dsh.client` 字段被 `dsh-client-modules` 自动扫描进 `window.__DSH_BOOT__`，无需额外接线。

> 注意：先停止 DSH 再 `pnpm install`，避免 Windows 替换在用文件。

## 使用

打开 **设置 → 插件 → 插件树**：

1. 页签内为启动卡，点击 **⛶ 全屏查看** 打开近全屏置顶 dialog；
2. 悬停节点看概要，点击节点看详情与出入边；
3. 工具栏 **⚠** 打开风险与冲突卡；右侧面板未选中节点时显示**安装前影响面预览**表单。

## 数据与边界

- 数据全部来自运行时只读投影：`loader.entries()`、已挂载 fiber 的 service store、`dynamicCordisRunner`、`slots.snapshot()`；不修改组合。
- 依赖边仅统计**已挂载** fiber 的服务快照；提供者无法映射到条目时记为 `framework`（框架内置）。

## 兼容

- DSH `0.1.0-rc.6`、`@deepseek-ai/cordis ^4.0.1`、`@deepseek-ai/cordis-plugin-loader ^1.0.2`、Web profile。

## 许可

[MIT](./LICENSE)
