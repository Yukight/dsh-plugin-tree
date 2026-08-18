# dsh-plugin-tree

> A **plugin-dependency DAG visualizer & runtime conflict detector** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Adds a "插件树 / Plugin Tree" tab under Settings → Plugins and a near-fullscreen pinned dialog with a force-directed graph.

[中文](./README.zh-CN.md) · [MIT](./LICENSE)

```
- [dsh-plugin-tree](#dsh-plugin-tree) — plugin dependency DAG visualization / conflict detection / pre-install impact preview
```

## Features

- **Dependency DAG**: force-directed layout of the Cordis Loader composition tree; solid edges = composition hierarchy, dashed blue arrows = runtime service-dependency edges (consumer → provider).
- **Node status lights**: 🟢 mounted ·  disabled ·  loading · 🔵 pending deps · 🔴 failed · hollow green = enabled-but-unmounted; missing dependencies get a red ring.
- **Dependency-weighted radius**: more-depended-on nodes render larger (small log step, modest growth), with radius-aware collision repulsion so big hubs don't obscure small nodes.
- **Conflict detection**: missing dependencies, mount failures, pending dependencies, and slot same-cell shadowing (⚠ issues card, click to focus the node).
- **Pre-install impact preview**: enter a candidate plugin's `inject` services and intended slots (`name` or `name#id`) to evaluate missing / provider / shadowing live, with injection points highlighted in the graph.
- **Layer filters**: user / feature / infra / framework (framework hidden by default).
- **Dynamic plugins visible**: process-local dynamic Cordis plugins (not Loader entries) appear as synthetic "dynamic" nodes.
- **Interactions**: wheel zoom, pan, node drag, hover info card, click detail panel (entry id / module path / display name / parent / state / config keys / in-out edge navigation).

## Install

Option 1: link a local profile (recommended while developing)

```jsonc
// <profile>/package.json
"dependencies": { "dsh-plugin-tree": "file:<absolute path to this repo>" }
```

```yaml
# <profile>/cordis.patch.yml (merge this repo's cordis.patch.yml)
- insert:
    - id: plugin-tree
      name: dsh-plugin-tree
```

Option 2: npm

```bash
pnpm add dsh-plugin-tree
```

Then add the `insert` row from `cordis.patch.yml` to your profile patch and restart DSH. The browser half is auto-scanned into `window.__DSH_BOOT__` via the `dsh.client` field in `package.json` — no extra wiring.

> Stop DSH before `pnpm install` to avoid replacing in-use files on Windows.

## Usage

Open **Settings → Plugins → Plugin Tree**:

1. The tab shows a launch card; click **⛶ Fullscreen** to open the near-fullscreen pinned dialog.
2. Hover a node for a summary; click for details and in/out edges.
3. Toolbar **⚠** opens the risks & conflicts card; with no node selected the right panel shows the **pre-install impact preview** form.

## Data & boundaries

- All data is a read-only runtime projection: `loader.entries()`, mounted fibers' service stores, `dynamicCordisRunner`, `slots.snapshot()`. It never mutates the composition.
- Dependency edges only cover **mounted** fibers' service snapshots; providers that don't map to an entry are labeled `framework`.

## Compatibility

- DSH `0.1.0-rc.6`, `@deepseek-ai/cordis ^4.0.1`, `@deepseek-ai/cordis-plugin-loader ^1.0.2`, Web profile.

## License

[MIT](./LICENSE)
