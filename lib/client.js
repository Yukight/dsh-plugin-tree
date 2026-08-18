/* dsh-plugin-tree — browser half (ModuleLoader bundle). */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-tree',
  factory: (require) => {
    const React = require('react')
    const module = { exports: {} }
    const exports = module.exports

    const NS = 'settings.pluginTree'
    const ZH = {
      tab: '插件树', loading: '正在读取插件树…', error: '暂时无法读取插件树。', retry: '重试',
      refresh: '刷新', search: '搜索插件', relayout: '重新布局', fit: '适应视图',
      highlight: '高亮依赖', hint: '滚轮缩放 · 拖拽平移 · 拖动节点 · 点击查看详情',
      legendEnabled: '已启用', legendLoading: '加载中', legendPending: '等待依赖', legendFailed: '失败',
      legendDisabled: '已停用', legendIdle: '已启用(未挂载)',
      stats: '节点 {nodes} · 插件 {plugins} · 已启用 {enabled} · 依赖边 {edges}',
      enabled: '已启用', disabled: '已停用', disabledByAncestor: '已停用(上层分组停用)',
      entryId: '条目 ID', modulePath: '模块路径', displayNameLabel: '显示名', parentLabel: '父节点',
      phaseLabel: 'Cordis 状态', selfState: '自身开关', childCount: '子节点数',
      injectServices: '依赖服务', consumesFrom: '依赖(出边)', providesTo: '被依赖(入边)',
      configKeys: '配置字段', summary: '概要', none: '无',
      phasePending: '等待依赖', phaseLoading: '加载中', phaseActive: '已挂载', phaseFailed: '挂载失败',
      phaseUnloading: '卸载中', phaseUnobserved: '未挂载',
      empty: '暂无插件。', emptySearch: '没有匹配的插件。', groupNode: '分组',
      clickHint: '点击查看详情', fullscreen: '全屏', close: '关闭', overlayLabel: '插件树全屏视图',
      depBadge: '出边 {out} · 入边 {in}',
      issues: '风险与冲突', missingServices: '缺失服务', issueMissing: '依赖缺失', issueFailed: '挂载失败',
      issuePending: '等待依赖', issueSlot: '槽位遮蔽', noIssues: '暂无风险。',
      layerUser: '用户', layerFeature: '功能', layerInfra: '基础设施', layerFramework: '框架',
      scanSummary: '已扫描 {slots} 个槽位 · {injects} 项 inject 声明 · 缺失服务 {missing} 项',
      open: '全屏查看', launchHint: '在几乎占满屏幕的置顶窗口中浏览插件依赖 DAG:节点灯光、服务依赖边、冲突检测与分层过滤。',
      preview: '安装前影响面预览', previewHint: '输入候选插件的 inject 服务与拟注册槽位,实时评估缺失/提供者/遮蔽,并在图中高亮注入点。',
      prevInject: 'inject 服务(逗号分隔)', prevSlots: '拟注册槽位(name 或 name#id,逗号分隔)',
      providedBy: '提供', missingTag: '缺失', frameworkTag: '框架内置',
      slotOk: '新槽位/新 cell,无冲突', slotShadow: '将遮蔽', slotMissing: '槽位未声明'
    }

    const PHASE_KEY = { pending: 'phasePending', loading: 'phaseLoading', active: 'phaseActive', failed: 'phaseFailed', unloading: 'phaseUnloading' }
    const LAYERS = ['user', 'feature', 'infra', 'framework']
    const LAYER_LABEL = { user: 'layerUser', feature: 'layerFeature', infra: 'layerInfra', framework: 'layerFramework' }
    const SPLIT_RE = /[^A-Za-z0-9_@.\/-]+/

    function insertCss(css) {
      if (typeof document === 'undefined') return () => {}
      if (document.getElementById('dpt-css')) return () => {}
      const tag = document.createElement('style')
      tag.id = 'dpt-css'
      tag.textContent = css
      document.head.appendChild(tag)
      return () => { tag.remove() }
    }

    function shortName(moduleName) {
      if (typeof moduleName !== 'string' || moduleName === '') return '?'
      const base = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
      return base.replace(/^cordis:/, '').replace(/^cordis-plugin-/, '').replace(/^dsh-(?:host-|client-)?/, '').replace(/^\.\//, '')
    }
    function layerOf(moduleName) {
      const name = typeof moduleName === 'string' ? moduleName : ''
      if (name.startsWith('cordis:') || name.indexOf('cordis-plugin-') !== -1 || name === '@deepseek-ai/cordis') return 'framework'
      if (name.startsWith('@deepseek-ai/dsh-tool-') || name.startsWith('@deepseek-ai/dsh-command-') || name.startsWith('@deepseek-ai/dsh-skill-') || name.startsWith('@deepseek-ai/dsh-client-')) return 'feature'
      if (name.startsWith('@deepseek-ai/dsh-')) return 'infra'
      return 'user'
    }
    function titleOf(node) { return (node.displayName && node.displayName !== '') ? node.displayName : (shortName(node.moduleName) || node.id) }
    function phaseText(t, phase) { return (phase === null || phase === undefined) ? t('phaseUnobserved') : t(PHASE_KEY[phase] || 'phaseUnobserved') }
    function dotFor(node, t) {
      if (!node.enabled) return { key: 'off', label: t('legendDisabled') }
      if (node.phase === 'active') return { key: 'on', label: t('phaseActive') }
      if (node.phase === 'failed') return { key: 'fail', label: t('phaseFailed') }
      if (node.phase === 'loading') return { key: 'loading', label: t('phaseLoading') }
      if (node.phase === 'pending') return { key: 'pending', label: t('phasePending') }
      return { key: 'idle', label: t('legendIdle') }
    }
    function colorFor(node) {
      if (!node.enabled) return { color: '#6e7681', lit: false, ring: false }
      if (node.phase === 'active') return { color: '#2ea043', lit: true, ring: false }
      if (node.phase === 'failed') return { color: '#f85149', lit: true, ring: false }
      if (node.phase === 'loading') return { color: '#d29922', lit: true, ring: false }
      if (node.phase === 'pending') return { color: '#58a6ff', lit: true, ring: false }
      return { color: '#2ea043', lit: false, ring: true }
    }
    function summaryOf(node, t) {
      const dot = dotFor(node, t)
      const stateText = node.enabled ? t('enabled') : (node.disabledOwn ? t('disabled') : t('disabledByAncestor'))
      if (node.isGroup) return t('groupNode') + ' · ' + stateText + ' · ' + node.childCount
      let text = dot.label + ' · ' + stateText
      if (node.inject.length > 0) text += ' · ' + t('injectServices') + ': ' + node.inject.slice(0, 5).join(', ') + (node.inject.length > 5 ? '…' : '')
      return text
    }
    function collectSlotScan(roots) {
      const issues = []; const byName = new Map(); let scanned = 0
      const walk = (node) => {
        scanned += 1; byName.set(node.name, node)
        if (node.kind !== 'chain') {
          const cells = new Map()
          for (const occ of node.occupants || []) {
            const cell = node.kind === 'single' ? '' : String(occ.key !== undefined ? occ.key : (occ.id !== undefined ? occ.id : ''))
            let list = cells.get(cell); if (list === undefined) { list = []; cells.set(cell, list) }
            list.push(occ)
          }
          for (const [cell, list] of cells) {
            if (list.length <= 1) continue
            const winner = list.find((o) => o.active === true)
            issues.push({ slot: node.name, cell, kind: node.kind, winner: winner !== undefined && winner.registrant !== undefined ? winner.registrant : '(none)', occupants: list.map((o) => (o.registrant !== undefined ? o.registrant : '?') + (o.active === true ? '*' : '')).join(', ') })
          }
        }
        for (const child of node.children || []) walk(child)
      }
      for (const root of roots) walk(root)
      return { issues, scanned, byName }
    }
    const CSS = `
.dpt{width:100%;max-width:1160px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:10px;position:relative;font-size:12px;line-height:18px}
.dpt.dpt-full{max-width:none;height:100%;min-height:0;flex:1}
.dpt-launch{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:28px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.dpt-launch h3{margin:0;font-size:15px;line-height:22px}
.dpt-launch p{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;max-width:520px}
.dpt-open{border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-button-floating-text, #fff);font:inherit;cursor:pointer;border-radius:8px;padding:8px 22px;font-size:13px}
.dpt-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex:none}
.dpt-search{display:flex;align-items:center;position:relative;flex:1;min-width:180px;max-width:300px}
.dpt-search input{width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:0 10px;font:inherit;font-size:12px}
.dpt-btn{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:transparent;border-radius:6px;padding:4px 10px;font-size:12px}
.dpt-warn{color:#d29922;border-color:#d29922}
.dpt-check{display:flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary);cursor:pointer;user-select:none}
.dpt-layers{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.dpt-layer{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:transparent;border-radius:10px;padding:1px 8px;font-size:10px;line-height:16px}
.dpt-layer[data-on='true']{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-state-business-primary)}
.dpt-stats{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dpt-hint{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dpt-legend{display:flex;flex-wrap:wrap;gap:10px;color:var(--dsw-alias-label-tertiary);font-size:11px;align-items:center;flex:none}
.dpt-legend span{display:inline-flex;align-items:center;gap:4px}
.dpt-dot{width:9px;height:9px;border-radius:50%;flex:none;display:inline-block}
.dpt-dot-on{background:#2ea043;box-shadow:0 0 6px 1px rgba(46,160,67,.6)}
.dpt-dot-off{background:#6e7681}
.dpt-dot-idle{background:transparent;border:1.5px solid #2ea043;box-sizing:border-box}
.dpt-dot-loading{background:#d29922;box-shadow:0 0 6px 1px rgba(210,153,34,.55)}
.dpt-dot-pending{background:#58a6ff;box-shadow:0 0 6px 1px rgba(88,166,255,.5)}
.dpt-dot-fail{background:#f85149;box-shadow:0 0 6px 1px rgba(248,81,73,.55)}
.dpt-body{position:relative}
.dpt-full .dpt-body{flex:1;min-height:0;display:flex;flex-direction:column}
.dpt-canvas{width:100%;height:46vh;min-height:340px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;position:relative;overflow:hidden;touch-action:none}
.dpt-canvas.dpt-canvas-full{flex:1;min-height:0;height:auto}
.dpt-canvas canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab;display:block}
.dpt-canvas-message{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);pointer-events:none}
.dpt-panel,.dpt-issues{position:absolute;top:10px;z-index:10;width:300px;max-height:calc(100% - 20px);overflow:auto;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-3) 90%, transparent);backdrop-filter:blur(8px);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;font-size:12px;line-height:18px;box-shadow:var(--dsw-shadow-lv1)}
.dpt-panel{right:10px}
.dpt-issues{left:10px;width:320px}
.dpt-panel h3{margin:0;font-size:13px;line-height:20px;word-break:break-all;padding-right:22px}
.dpt-panel h4,.dpt-issues h4{margin:8px 0 0;font-size:11px;color:var(--dsw-alias-label-tertiary);font-weight:600}
.dpt-summary{color:var(--dsw-alias-label-tertiary);margin:0}
.dpt-close{position:absolute;top:8px;right:8px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:6px}
.dpt-kv{display:grid;grid-template-columns:88px 1fr;gap:2px 10px;font-size:12px}
.dpt-kv dt{color:var(--dsw-alias-label-tertiary)}
.dpt-kv dd{margin:0;min-width:0}
.dpt-code{font-family:ui-monospace,Consolas,monospace;font-size:11px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:1px 5px;word-break:break-all;display:inline-block;max-width:100%}
.dpt-chips{display:flex;flex-wrap:wrap;gap:4px}
.dpt-chip{font-family:ui-monospace,Consolas,monospace;font-size:10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:0 7px;color:var(--dsw-alias-label-secondary)}
.dpt-chip-bad{color:#f85149;border-color:#f85149}
.dpt-chip-ok{color:#2ea043;border-color:#2ea043}
.dpt-edge{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;padding:1px 0;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpt-edge code{color:var(--dsw-alias-label-tertiary);font-size:10px}
.dpt-issue{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;padding:3px 6px;cursor:pointer;border-radius:6px;line-height:16px}
.dpt-issue[data-kind='missing'],.dpt-issue[data-kind='failed']{color:#f85149}
.dpt-issue[data-kind='pending']{color:#58a6ff}
.dpt-issue-static{display:block;color:#d29922;font-size:11px;padding:3px 6px;line-height:16px;word-break:break-all}
.dpt-scan{color:var(--dsw-alias-label-tertiary);font-size:10px;margin:0}
.dpt-field{display:flex;flex-direction:column;gap:3px}
.dpt-field label{color:var(--dsw-alias-label-tertiary);font-size:10px}
.dpt-field input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:6px;outline:none;padding:4px 8px;font:inherit;font-size:11px}
.dpt-tip{position:fixed;z-index:80;pointer-events:none;max-width:330px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;box-shadow:var(--dsw-shadow-lv1);display:flex;flex-direction:column;gap:3px;font-size:11px;line-height:16px}
.dpt-tip b{font-size:12px;word-break:break-all}
.dpt-tip span{color:var(--dsw-alias-label-tertiary);word-break:break-all}
.dpt-tip .dpt-bad{color:#f85149}
.dpt-dialog{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:14px;width:calc(100vw - 44px);height:calc(100vh - 44px);max-width:none;max-height:none;color:var(--dsw-alias-label-primary);box-shadow:0 18px 60px rgba(0,0,0,.35);pointer-events:auto}
.dpt-dialog[open]{display:flex}
.dpt-dialog::backdrop{background:rgba(0,0,0,.45)}
`
    function makeSimulation(graph, aspect) {
      const byId = new Map()
      const nodes = graph.nodes.map((node) => {
        const depIn = (graph.provides.get(node.id) || []).length
        const colors = colorFor(node)
        let label = node.displayName && node.displayName !== '' ? node.displayName : shortName(node.moduleName)
        if (label === '' || label === '?') label = node.id
        if (label.length > 18) label = label.slice(0, 17) + '…'
        return { id: node.id, x: 0, y: 0, vx: 0, vy: 0, fixed: false, r: node.isGroup ? 8 : 5 + Math.min(6, Math.log(1 + depIn) * 1.2), color: colors.color, lit: colors.lit, ring: colors.ring, label, data: node }
      })
      for (const node of nodes) byId.set(node.id, node)
      const edges = []
      for (const node of graph.nodes) {
        if (node.parentId !== null && node.parentId !== undefined && byId.has(node.parentId)) {
          edges.push({ source: byId.get(node.parentId), target: byId.get(node.id), kind: 'tree', rest: 32, k: 0.9 })
        }
      }
      for (const edge of graph.edges) {
        const a = byId.get(edge.from); const b = byId.get(edge.to)
        if (a !== undefined && b !== undefined) edges.push({ source: a, target: b, kind: 'dep', rest: 74, k: 0.16 })
      }
      return { nodes, edges, byId, repulsion: 1400, settle: 150, aspect, gravityX: 0.0022 / aspect, gravityY: 0.0022 }
    }
    function initLayout(graph, sim) {
      const aspect = sim.aspect || 1
      const angleOf = new Map(); const depthOf = new Map(); const order = []; const seen = new Set()
      const queue = graph.roots.slice()
      for (let i = 0; i < graph.roots.length; i++) {
        depthOf.set(graph.roots[i].id, 0)
        angleOf.set(graph.roots[i].id, graph.roots.length === 1 ? 0 : (i / graph.roots.length) * Math.PI * 2)
      }
      while (queue.length > 0) {
        const node = queue.shift()
        if (seen.has(node.id)) continue
        seen.add(node.id); order.push(node)
        for (const kid of graph.childrenOf.get(node.id) || []) queue.push(kid)
      }
      for (const node of order) {
        const depth = depthOf.get(node.id) || 0
        const kids = graph.childrenOf.get(node.id) || []
        const sector = Math.min(2.2, 0.9 + depth * 0.35)
        const baseAngle = angleOf.get(node.id) || 0
        for (let i = 0; i < kids.length; i++) {
          const frac = kids.length === 1 ? 0 : i / (kids.length - 1) - 0.5
          depthOf.set(kids[i].id, depth + 1)
          angleOf.set(kids[i].id, baseAngle + frac * sector)
        }
      }
      for (const node of sim.nodes) {
        const depth = depthOf.get(node.id) || 0
        const angle = angleOf.get(node.id) || 0
        const radius = 55 + depth * 68
        node.x = Math.cos(angle) * radius * aspect
        node.y = Math.sin(angle) * radius
        node.vx = 0; node.vy = 0; node.fixed = false
      }
      sim.settle = 150
    }
    function stepSimulation(sim) {
      const nodes = sim.nodes; const count = nodes.length
      for (let i = 0; i < count; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < count; j++) {
          const b = nodes[j]
          let dx = a.x - b.x; let dy = a.y - b.y
          let d2 = dx * dx + dy * dy
          if (d2 < 1) { d2 = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5 }
          const d = Math.sqrt(d2)
          const f = (sim.repulsion / d2) * 0.05
          a.vx += (dx / d) * f; a.vy += (dy / d) * f
          b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
          const minDist = a.r + b.r + 6
          if (d < minDist) {
            const push = (minDist - d) * 0.18
            a.vx += (dx / d) * push; a.vy += (dy / d) * push
            b.vx -= (dx / d) * push; b.vy -= (dy / d) * push
          }
        }
      }
      for (const edge of sim.edges) {
        const a = edge.source; const b = edge.target
        const dx = b.x - a.x; const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (d - edge.rest) * edge.k * 0.025
        a.vx += (dx / d) * f; a.vy += (dy / d) * f
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
      }
      for (const node of nodes) {
        if (node.fixed) { node.vx = 0; node.vy = 0; continue }
        node.vx += (0 - node.x) * (sim.gravityX || 0.0022)
        node.vy += (0 - node.y) * (sim.gravityY || 0.0022)
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
        if (speed > 6) { node.vx = (node.vx / speed) * 6; node.vy = (node.vy / speed) * 6 }
        node.vx *= 0.78; node.vy *= 0.78
        node.x += node.vx; node.y += node.vy
      }
    }
    function hitTest(sim, view, rect, sx, sy) {
      if (sim === null) return null
      const wx = view.x + (sx - rect.width / 2) / view.scale
      const wy = view.y + (sy - rect.height / 2) / view.scale
      let best = null; let bestD = 12 / view.scale
      for (const node of sim.nodes) {
        const dx = node.x - wx; const dy = node.y - wy
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d <= node.r + 3 && d < bestD) { best = node; bestD = Math.max(node.r + 3, d) }
      }
      return best
    }
    function fitView(sim, view, canvasRef) {
      const canvas = canvasRef.current
      if (canvas === null || sim === null || sim.nodes.length === 0) return
      const w = canvas.clientWidth || 600; const h = canvas.clientHeight || 400
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const node of sim.nodes) {
        if (node.x < minX) minX = node.x
        if (node.x > maxX) maxX = node.x
        if (node.y < minY) minY = node.y
        if (node.y > maxY) maxY = node.y
      }
      if (maxX === -Infinity) return
      view.scale = Math.min(2.2, Math.max(0.3, Math.min(w / Math.max(60, maxX - minX), h / Math.max(60, maxY - minY)) * 0.92))
      view.x = (minX + maxX) / 2; view.y = (minY + maxY) / 2
    }
    function fitToIds(sim, view, canvasRef, ids) {
      const canvas = canvasRef.current
      if (canvas === null || sim === null || ids.size === 0) return
      const w = canvas.clientWidth || 600; const h = canvas.clientHeight || 400
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const node of sim.nodes) {
        if (!ids.has(node.id)) continue
        if (node.x < minX) minX = node.x
        if (node.x > maxX) maxX = node.x
        if (node.y < minY) minY = node.y
        if (node.y > maxY) maxY = node.y
      }
      if (maxX === -Infinity) return
      view.scale = Math.min(2.4, Math.max(0.35, Math.min(w / Math.max(80, maxX - minX), h / Math.max(80, maxY - minY)) * 0.95))
      view.x = (minX + maxX) / 2; view.y = (minY + maxY) / 2
    }
    function draw(canvas, sim, view, ui, container) {
      if (canvas === null || sim === null) return
      const g = canvas.getContext('2d')
      if (g === null) return
      const w = canvas.clientWidth; const h = canvas.clientHeight
      if (w === 0 || h === 0) return
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
      const pw = Math.round(w * dpr); const ph = Math.round(h * dpr)
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      let labelColor = '#c9d1d9'; let treeColor = '#8b949e'; let depColor = '#58a6ff'
      if (container !== null) {
        try {
          const cs = getComputedStyle(container)
          if (cs.color) labelColor = cs.color
          const tree = cs.getPropertyValue('--dsw-alias-border-l2').trim()
          if (tree !== '') treeColor = tree
          const dep = cs.getPropertyValue('--dsw-alias-state-business-primary').trim()
          if (dep !== '') depColor = dep
        } catch (error) {}
      }
      const tx = (x) => (x - view.x) * view.scale + w / 2
      const ty = (y) => (y - view.y) * view.scale + h / 2
      const focusId = ui.hoverId !== null && ui.hoverId !== undefined ? ui.hoverId : ui.selectedId
      const dim = ui.dimSet
      for (const pass of [0, 1]) {
        for (const edge of sim.edges) {
          if ((edge.kind === 'tree') !== (pass === 0)) continue
          const a = edge.source; const b = edge.target
          const x1 = tx(a.x), y1 = ty(a.y), x2 = tx(b.x), y2 = ty(b.y)
          if ((x1 < -40 && x2 < -40) || (x1 > w + 40 && x2 > w + 40) || (y1 < -40 && y2 < -40) || (y1 > h + 40 && y2 > h + 40)) continue
          const focused = focusId !== null && focusId !== undefined && (a.id === focusId || b.id === focusId)
          const dimmed = dim !== null && (dim.has(a.id) || dim.has(b.id))
          g.save()
          g.globalAlpha = dimmed ? 0.05 : (focused ? 0.95 : (edge.kind === 'tree' ? 0.2 : 0.3))
          g.strokeStyle = edge.kind === 'tree' ? treeColor : depColor
          g.lineWidth = focused ? 1.7 : 1
          if (edge.kind === 'dep') g.setLineDash([3, 4])
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
          if (edge.kind === 'dep') {
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const off = b.r * view.scale + 3
            const ax = x2 - Math.cos(angle) * off; const ay = y2 - Math.sin(angle) * off
            g.setLineDash([])
            g.fillStyle = depColor
            g.beginPath(); g.moveTo(ax, ay)
            g.lineTo(ax - Math.cos(angle - 0.42) * 6, ay - Math.sin(angle - 0.42) * 6)
            g.lineTo(ax - Math.cos(angle + 0.42) * 6, ay - Math.sin(angle + 0.42) * 6)
            g.closePath(); g.fill()
          }
          g.restore()
        }
      }
      for (const node of sim.nodes) {
        const x = tx(node.x); const y = ty(node.y)
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) continue
        const dimmed = dim !== null && dim.has(node.id)
        const matched = ui.matchSet !== null && ui.matchSet.has(node.id)
        const focused = node.id === focusId
        const hasMissing = node.data.missingServices !== undefined && node.data.missingServices.length > 0
        const r = node.r * (focused ? 1.3 : 1)
        g.save()
        g.globalAlpha = dimmed ? 0.2 : 1
        if (node.lit && !dimmed) { g.shadowColor = node.color; g.shadowBlur = focused ? 18 : 11 }
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = node.color; g.fill()
        g.shadowBlur = 0
        if (node.ring) { g.lineWidth = 1.6; g.strokeStyle = node.color; g.stroke() }
        if (hasMissing) { g.beginPath(); g.arc(x, y, r + 2.5, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = '#f85149'; g.stroke() }
        if (matched) { g.beginPath(); g.arc(x, y, r + 4.5, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = depColor; g.stroke() }
        if (focused) { g.beginPath(); g.arc(x, y, r + 4.5, 0, Math.PI * 2); g.lineWidth = 1.4; g.strokeStyle = labelColor; g.stroke() }
        g.restore()
        if (view.scale >= 0.8 || focused || matched) {
          g.save()
          g.globalAlpha = dimmed ? 0.3 : 0.95
          g.font = (focused ? 'bold ' : '') + '10px system-ui, sans-serif'
          g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = labelColor
          g.fillText(node.label, x, y + r + 8)
          g.restore()
        }
      }
    }
    function GraphTab(props) {
      const t = props.t
      const fullscreen = props.fullscreen === true
      const [state, setState] = React.useState({ status: 'loading' })
      const [request, setRequest] = React.useState(0)
      const [query, setQuery] = React.useState('')
      const [selectedId, setSelectedId] = React.useState(null)
      const [hoverId, setHoverId] = React.useState(null)
      const [highlight, setHighlight] = React.useState(true)
      const [issuesOpen, setIssuesOpen] = React.useState(false)
      const [hiddenLayers, setHiddenLayers] = React.useState(() => new Set(['framework']))
      const [prevInject, setPrevInject] = React.useState('')
      const [prevSlots, setPrevSlots] = React.useState('')
      const canvasRef = React.useRef(null)
      const boxRef = React.useRef(null)
      const tipRef = React.useRef(null)
      const viewRef = React.useRef({ x: 0, y: 0, scale: 0.9 })
      const simRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const panRef = React.useRef(null)
      const tipPosRef = React.useRef({ x: 0, y: 0 })
      const uiRef = React.useRef({ hoverId: null, selectedId: null, dimSet: null, matchSet: null })

      React.useEffect(() => {
        let alive = true
        Promise.resolve()
          .then(() => props.list())
          .then((snapshot) => {
            if (!alive) return
            let slotIssues = []; let slotCount = 0; let slotByName = new Map()
            if (props.slotsApi !== undefined) {
              try {
                const snap = props.slotsApi.snapshot()
                const scan = collectSlotScan(Array.isArray(snap) ? snap : [])
                slotIssues = scan.issues; slotCount = scan.scanned; slotByName = scan.byName
              } catch (error) {}
            }
            setState({ status: 'ready', snapshot, slotIssues, slotCount, slotByName, serviceProviders: snapshot.serviceProviders || {} })
          })
          .catch(() => { if (alive) setState({ status: 'error' }) })
        return () => { alive = false }
      }, [props.list, props.slotsApi, request])

      const graph = React.useMemo(() => {
        if (state.status !== 'ready') return null
        const nodes = state.snapshot.nodes || []
        const index = new Map(); const childrenOf = new Map(); const roots = []
        for (const node of nodes) index.set(node.id, node)
        for (const node of nodes) {
          if (node.parentId === null || node.parentId === undefined || !index.has(node.parentId)) roots.push(node)
          else {
            let list = childrenOf.get(node.parentId)
            if (list === undefined) { list = []; childrenOf.set(node.parentId, list) }
            list.push(node)
          }
        }
        const consumes = new Map(); const provides = new Map()
        for (const edge of state.snapshot.edges || []) {
          let a = consumes.get(edge.from); if (a === undefined) { a = []; consumes.set(edge.from, a) }
          a.push({ to: edge.to, service: edge.service })
          let b = provides.get(edge.to); if (b === undefined) { b = []; provides.set(edge.to, b) }
          b.push({ from: edge.from, service: edge.service })
        }
        return { nodes, index, childrenOf, roots, consumes, provides, edges: state.snapshot.edges || [] }
      }, [state])

      const layerCounts = React.useMemo(() => {
        const counts = { user: 0, feature: 0, infra: 0, framework: 0 }
        if (graph !== null) for (const node of graph.nodes) counts[layerOf(node.moduleName)] += 1
        return counts
      }, [graph])

      const viewGraph = React.useMemo(() => {
        if (graph === null) return null
        if (hiddenLayers.size === 0) return graph
        const visible = new Set(); const nodes = []
        for (const node of graph.nodes) {
          if (hiddenLayers.has(layerOf(node.moduleName))) continue
          visible.add(node.id); nodes.push(node)
        }
        const index = new Map(); const childrenOf = new Map(); const roots = []
        for (const node of nodes) index.set(node.id, node)
        for (const node of nodes) {
          if (node.parentId !== null && node.parentId !== undefined && visible.has(node.parentId)) {
            let list = childrenOf.get(node.parentId)
            if (list === undefined) { list = []; childrenOf.set(node.parentId, list) }
            list.push(node)
          } else roots.push(node)
        }
        const consumes = new Map(); const provides = new Map(); const edges = []
        for (const edge of graph.edges) {
          if (!visible.has(edge.from) || !visible.has(edge.to)) continue
          edges.push(edge)
          let a = consumes.get(edge.from); if (a === undefined) { a = []; consumes.set(edge.from, a) }
          a.push({ to: edge.to, service: edge.service })
          let b = provides.get(edge.to); if (b === undefined) { b = []; provides.set(edge.to, b) }
          b.push({ from: edge.from, service: edge.service })
        }
        return { nodes, index, childrenOf, roots, consumes, provides, edges }
      }, [graph, hiddenLayers])

      const issues = React.useMemo(() => {
        if (graph === null) return []
        const out = []
        for (const node of graph.nodes) {
          if (node.missingServices !== undefined && node.missingServices.length > 0 && node.enabled) {
            out.push({ kind: 'missing', nodeId: node.id, text: titleOf(node) + ' · ' + t('issueMissing') + ': ' + node.missingServices.join(', ') })
          }
          if (node.phase === 'failed') out.push({ kind: 'failed', nodeId: node.id, text: titleOf(node) + ' · ' + t('issueFailed') })
          else if (node.enabled && node.phase === 'pending') out.push({ kind: 'pending', nodeId: node.id, text: titleOf(node) + ' · ' + t('issuePending') + (node.inject.length > 0 ? ': ' + node.inject.join(', ') : '') })
        }
        return out
      }, [graph, t])

      const slotIssues = state.status === 'ready' ? state.slotIssues : []
      const slotCount = state.status === 'ready' ? state.slotCount : 0
      const slotByName = state.status === 'ready' ? state.slotByName : new Map()
      const serviceProviders = state.status === 'ready' ? state.serviceProviders : {}
      const totalIssues = issues.length + slotIssues.length
      const injectCount = React.useMemo(() => {
        if (graph === null) return 0
        let count = 0
        for (const node of graph.nodes) count += node.inject.length
        return count
      }, [graph])

      const preview = React.useMemo(() => {
        if (state.status !== 'ready') return null
        const injects = prevInject.split(SPLIT_RE).filter(Boolean)
        const slots = prevSlots.split(/[,，]+/).map((s) => s.trim()).filter(Boolean)
        if (injects.length === 0 && slots.length === 0) return null
        const injectReport = injects.map((name) => ({ name, provider: serviceProviders[name] === undefined ? null : serviceProviders[name] }))
        const slotReport = slots.map((spec) => {
          const hash = spec.indexOf('#')
          const slotName = hash === -1 ? spec : spec.slice(0, hash)
          const cellId = hash === -1 ? null : spec.slice(hash + 1)
          const slotNode = slotByName.get(slotName)
          if (slotNode === undefined) return { spec, slotName, exists: false, kind: null, shadow: [] }
          const occupants = slotNode.occupants || []
          let shadow = []
          if (slotNode.kind === 'single') shadow = occupants
          else {
            const cell = cellId === null ? '' : cellId
            shadow = occupants.filter((occ) => String(occ.key !== undefined ? occ.key : (occ.id !== undefined ? occ.id : '')) === cell)
          }
          return { spec, slotName, exists: true, kind: slotNode.kind, shadow }
        })
        const providerIds = []
        for (const row of injectReport) {
          if (row.provider !== null && row.provider !== 'framework' && providerIds.indexOf(row.provider) === -1) providerIds.push(row.provider)
        }
        return { injectReport, slotReport, providerIds }
      }, [state, prevInject, prevSlots, serviceProviders, slotByName])

      const matchSet = React.useMemo(() => {
        if (viewGraph === null || !fullscreen) return null
        const q = query.trim().toLowerCase()
        if (q === '') return null
        const out = new Set()
        for (const node of viewGraph.nodes) {
          if ((node.id + ' ' + node.moduleName + ' ' + node.displayName).toLowerCase().indexOf(q) !== -1) out.add(node.id)
        }
        return out
      }, [viewGraph, query, fullscreen])

      const depSet = React.useMemo(() => {
        if (viewGraph === null || selectedId === null || selectedId === undefined || !viewGraph.index.has(selectedId)) return null
        const out = new Set([selectedId])
        for (const row of viewGraph.consumes.get(selectedId) || []) out.add(row.to)
        for (const row of viewGraph.provides.get(selectedId) || []) out.add(row.from)
        let cursor = viewGraph.index.get(selectedId)
        for (let i = 0; i < 64 && cursor !== undefined; i++) {
          out.add(cursor.id)
          const pid = cursor.parentId
          if (pid === null || pid === undefined || !viewGraph.index.has(pid)) break
          cursor = viewGraph.index.get(pid)
        }
        return out
      }, [viewGraph, selectedId])

      const dimSet = React.useMemo(() => {
        if (viewGraph === null) return null
        const out = new Set()
        if (matchSet !== null) {
          if (matchSet.size === 0) for (const n of viewGraph.nodes) out.add(n.id)
          else for (const n of viewGraph.nodes) if (!matchSet.has(n.id)) out.add(n.id)
        }
        if (highlight && selectedId !== null && selectedId !== undefined && viewGraph.index.has(selectedId)) {
          if (depSet === null) for (const n of viewGraph.nodes) out.add(n.id)
          else for (const n of viewGraph.nodes) if (!depSet.has(n.id)) out.add(n.id)
        }
        if (preview !== null && (selectedId === null || selectedId === undefined) && preview.providerIds.length > 0) {
          for (const n of viewGraph.nodes) if (preview.providerIds.indexOf(n.id) === -1) out.add(n.id)
        }
        return out.size === 0 ? null : out
      }, [viewGraph, matchSet, depSet, highlight, selectedId, preview])

      uiRef.current = { hoverId, selectedId, dimSet, matchSet }

      React.useEffect(() => {
        if (!fullscreen || state.status !== 'ready' || viewGraph === null) return
        const canvas = canvasRef.current
        if (canvas === null) return
        const rect = canvas.getBoundingClientRect()
        const aspect = Math.min(2.2, Math.max(1, rect.width / Math.max(1, rect.height)))
        const sim = makeSimulation(viewGraph, aspect)
        simRef.current = sim
        initLayout(viewGraph, sim)
        fitView(sim, viewRef.current, canvasRef)
        const onWheel = (event) => {
          event.preventDefault()
          const view = viewRef.current
          const r = canvas.getBoundingClientRect()
          const mx = event.clientX - r.left; const my = event.clientY - r.top
          const factor = Math.exp(-event.deltaY * 0.0022)
          const next = Math.min(4, Math.max(0.2, view.scale * factor))
          const wx = view.x + (mx - r.width / 2) / view.scale
          const wy = view.y + (my - r.height / 2) / view.scale
          view.scale = next
          view.x = wx - (mx - r.width / 2) / next
          view.y = wy - (my - r.height / 2) / next
        }
        canvas.addEventListener('wheel', onWheel, { passive: false })
        let raf = 0
        const loop = () => {
          const current = simRef.current
          if (current !== null && canvasRef.current !== null) {
            stepSimulation(current)
            if (current.settle > 0) {
              current.settle -= 1
              if (current.settle % 10 === 0 && dragRef.current === null && panRef.current === null) fitView(current, viewRef.current, canvasRef)
            }
            draw(canvasRef.current, current, viewRef.current, uiRef.current, boxRef.current)
          }
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => {
          canvas.removeEventListener('wheel', onWheel)
          if (raf !== 0) cancelAnimationFrame(raf)
        }
      }, [state, viewGraph, fullscreen])

      React.useEffect(() => {
        if (matchSet === null || matchSet.size === 0 || simRef.current === null) return
        fitToIds(simRef.current, viewRef.current, canvasRef, matchSet)
      }, [matchSet])

      const retry = () => { setState({ status: 'loading' }); setRequest((v) => v + 1) }
      const relayout = () => {
        if (viewGraph === null || simRef.current === null) return
        const canvas = canvasRef.current
        if (canvas !== null) {
          const rect = canvas.getBoundingClientRect()
          simRef.current.aspect = Math.min(2.2, Math.max(1, rect.width / Math.max(1, rect.height)))
          simRef.current.gravityX = 0.0022 / simRef.current.aspect
        }
        initLayout(viewGraph, simRef.current)
        fitView(simRef.current, viewRef.current, canvasRef)
      }
      const fit = () => fitView(simRef.current, viewRef.current, canvasRef)
      const focusNode = (id) => {
        if (viewGraph === null || !viewGraph.index.has(id)) return
        setSelectedId(id)
        fitToIds(simRef.current, viewRef.current, canvasRef, new Set([id]))
      }
      const toggleLayer = (layer) => setHiddenLayers((cur) => {
        const next = new Set(cur)
        if (next.has(layer)) next.delete(layer)
        else next.add(layer)
        return next
      })
      const moveTip = (event) => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1400
        const vh = typeof window !== 'undefined' ? window.innerHeight : 900
        tipPosRef.current = { x: Math.min(event.clientX + 14, vw - 340), y: Math.min(event.clientY + 14, vh - 200) }
        const el = tipRef.current
        if (el !== null) { el.style.left = tipPosRef.current.x + 'px'; el.style.top = tipPosRef.current.y + 'px' }
      }
      const onPointerDown = (event) => {
        const canvas = event.currentTarget
        const rect = canvas.getBoundingClientRect()
        const sx = event.clientX - rect.left; const sy = event.clientY - rect.top
        const hit = hitTest(simRef.current, viewRef.current, rect, sx, sy)
        try { canvas.setPointerCapture(event.pointerId) } catch (error) {}
        if (hit !== null) dragRef.current = { id: hit.id, x: sx, y: sy, moved: false }
        else panRef.current = { x: sx, y: sy, moved: false }
      }
      const onPointerMove = (event) => {
        const canvas = event.currentTarget
        const rect = canvas.getBoundingClientRect()
        const sx = event.clientX - rect.left; const sy = event.clientY - rect.top
        const sim = simRef.current
        const view = viewRef.current
        if (dragRef.current !== null) {
          const d = dragRef.current
          if (!d.moved && (Math.abs(sx - d.x) > 3 || Math.abs(sy - d.y) > 3)) d.moved = true
          if (d.moved && sim !== null) {
            const node = sim.byId.get(d.id)
            if (node !== undefined) {
              node.x = view.x + (sx - rect.width / 2) / view.scale
              node.y = view.y + (sy - rect.height / 2) / view.scale
              node.fixed = true
            }
          }
          if (hoverId !== null) setHoverId(null)
          return
        }
        if (panRef.current !== null) {
          const p = panRef.current
          if (!p.moved && (Math.abs(sx - p.x) > 3 || Math.abs(sy - p.y) > 3)) p.moved = true
          view.x -= (sx - p.x) / view.scale
          view.y -= (sy - p.y) / view.scale
          panRef.current = { x: sx, y: sy, moved: p.moved }
          if (hoverId !== null) setHoverId(null)
          return
        }
        const hit = hitTest(sim, view, rect, sx, sy)
        const id = hit === null ? null : hit.id
        moveTip(event)
        if (id !== hoverId) setHoverId(id)
      }
      const onPointerUp = (event) => {
        if (dragRef.current !== null) {
          const d = dragRef.current
          if (d.moved) {
            const node = simRef.current !== null ? simRef.current.byId.get(d.id) : undefined
            if (node !== undefined) { node.fixed = false; node.vx = 0; node.vy = 0 }
          } else setSelectedId(d.id)
          dragRef.current = null
        } else if (panRef.current !== null) {
          if (!panRef.current.moved) setSelectedId(null)
          panRef.current = null
        }
        try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (error) {}
      }
      const onPointerLeave = () => { if (dragRef.current === null && panRef.current === null) setHoverId(null) }
      const hoverNode = hoverId !== null && hoverId !== undefined && viewGraph !== null ? viewGraph.index.get(hoverId) : undefined
      const selected = selectedId !== null && selectedId !== undefined && viewGraph !== null ? viewGraph.index.get(selectedId) : undefined
      const providerTitle = (pid) => {
        if (pid === 'framework') return t('frameworkTag')
        const node = graph !== null ? graph.index.get(pid) : undefined
        return node !== undefined ? titleOf(node) : pid
      }

      const renderPreview = () => React.createElement(React.Fragment, null,
        React.createElement('h3', null, t('preview')),
        React.createElement('p', { className: 'dpt-summary' }, t('previewHint')),
        React.createElement('div', { className: 'dpt-field' },
          React.createElement('label', null, t('prevInject')),
          React.createElement('input', { type: 'text', value: prevInject, onChange: (e) => setPrevInject(e.currentTarget.value) })
        ),
        React.createElement('div', { className: 'dpt-field' },
          React.createElement('label', null, t('prevSlots')),
          React.createElement('input', { type: 'text', value: prevSlots, onChange: (e) => setPrevSlots(e.currentTarget.value) })
        ),
        preview !== null ? React.createElement(React.Fragment, null,
          React.createElement('h4', null, t('injectServices')),
          preview.injectReport.length > 0
            ? React.createElement('div', { className: 'dpt-chips' }, preview.injectReport.map((row) => React.createElement('span', {
                key: row.name,
                className: row.provider === null ? 'dpt-chip dpt-chip-bad' : 'dpt-chip dpt-chip-ok'
              }, row.name + (row.provider === null ? ' · ' + t('missingTag') : ' · ' + providerTitle(row.provider)))))
            : React.createElement('span', { className: 'dpt-summary' }, t('none')),
          React.createElement('h4', null, t('prevSlots')),
          preview.slotReport.map((row) => {
            let text
            if (!row.exists) text = row.slotName + ' · ' + t('slotMissing')
            else if (row.shadow.length > 0) text = row.slotName + ' [' + row.kind + '] · ' + t('slotShadow') + ': ' + row.shadow.map((o) => o.registrant || '?').join(', ')
            else text = row.slotName + ' [' + row.kind + '] · ' + t('slotOk')
            return React.createElement('span', { key: row.spec, className: row.shadow.length > 0 || !row.exists ? 'dpt-issue-static' : 'dpt-summary' }, text)
          })
        ) : null
      )

      const renderPanel = () => {
        if (selected !== undefined) {
          const consumes = viewGraph.consumes.get(selected.id) || []
          const provides = viewGraph.provides.get(selected.id) || []
          const stateText = selected.enabled ? t('enabled') : (selected.disabledOwn ? t('disabled') : t('disabledByAncestor'))
          const missing = selected.missingServices !== undefined ? selected.missingServices : []
          return React.createElement('div', { className: 'dpt-panel' },
            React.createElement('button', { type: 'button', className: 'dpt-close', 'aria-label': t('close'), onClick: () => setSelectedId(null) }, '✕'),
            React.createElement('h3', null, titleOf(selected)),
            React.createElement('p', { className: 'dpt-summary' }, summaryOf(selected, t)),
            React.createElement('dl', { className: 'dpt-kv' },
              React.createElement('dt', null, t('entryId')), React.createElement('dd', null, React.createElement('code', { className: 'dpt-code' }, selected.id)),
              React.createElement('dt', null, t('modulePath')), React.createElement('dd', null, React.createElement('code', { className: 'dpt-code' }, selected.moduleName || '—')),
              React.createElement('dt', null, t('displayNameLabel')), React.createElement('dd', null, selected.displayName || '—'),
              React.createElement('dt', null, t('parentLabel')), React.createElement('dd', null, selected.parentId || '—'),
              React.createElement('dt', null, t('phaseLabel')), React.createElement('dd', null, phaseText(t, selected.phase)),
              React.createElement('dt', null, t('selfState')), React.createElement('dd', null, stateText),
              React.createElement('dt', null, t('childCount')), React.createElement('dd', null, String(selected.childCount)),
              React.createElement('dt', null, t('configKeys')), React.createElement('dd', null, selected.configKeys.length > 0 ? selected.configKeys.join(', ') : t('none'))
            ),
            React.createElement('h4', null, t('injectServices')),
            React.createElement('div', { className: 'dpt-chips' },
              selected.inject.length > 0 ? selected.inject.map((n) => React.createElement('span', { key: n, className: 'dpt-chip' }, n)) : React.createElement('span', { className: 'dpt-summary' }, t('none'))
            ),
            missing.length > 0 ? React.createElement(React.Fragment, null,
              React.createElement('h4', null, t('missingServices')),
              React.createElement('div', { className: 'dpt-chips' }, missing.map((n) => React.createElement('span', { key: n, className: 'dpt-chip dpt-chip-bad' }, n)))
            ) : null,
            React.createElement('h4', null, t('consumesFrom')),
            consumes.length > 0 ? consumes.map((e) => React.createElement('button', { key: 'c' + e.service + e.to, type: 'button', className: 'dpt-edge', onClick: () => setSelectedId(e.to) }, titleOf(viewGraph.index.get(e.to)), ' ', React.createElement('code', null, '← ' + e.service))) : React.createElement('span', { className: 'dpt-summary' }, t('none')),
            React.createElement('h4', null, t('providesTo')),
            provides.length > 0 ? provides.map((e) => React.createElement('button', { key: 'p' + e.service + e.from, type: 'button', className: 'dpt-edge', onClick: () => setSelectedId(e.from) }, titleOf(viewGraph.index.get(e.from)), ' ', React.createElement('code', null, '→ ' + e.service))) : React.createElement('span', { className: 'dpt-summary' }, t('none'))
          )
        }
        return React.createElement('div', { className: 'dpt-panel' }, renderPreview())
      }

      const renderIssues = () => {
        if (!issuesOpen) return null
        const missingTotal = totals !== null && totals.missing !== undefined ? totals.missing : 0
        return React.createElement('div', { className: 'dpt-issues' },
          React.createElement('button', { type: 'button', className: 'dpt-close', 'aria-label': t('close'), onClick: () => setIssuesOpen(false) }, '✕'),
          React.createElement('h4', { style: { marginTop: 0 } }, t('issues') + ' · ' + totalIssues),
          React.createElement('p', { className: 'dpt-scan' }, t('scanSummary').replace('{slots}', slotCount).replace('{injects}', injectCount).replace('{missing}', missingTotal)),
          totalIssues === 0 ? React.createElement('span', { className: 'dpt-summary' }, t('noIssues')) : null,
          issues.map((issue) => React.createElement('button', { key: issue.kind + issue.nodeId, type: 'button', className: 'dpt-issue', 'data-kind': issue.kind, onClick: () => focusNode(issue.nodeId) }, issue.text)),
          slotIssues.map((issue, i) => React.createElement('span', { key: 'slot' + i, className: 'dpt-issue-static', title: issue.slot + ' [' + issue.cell + ']' }, t('issueSlot') + ': ' + issue.slot + (issue.cell !== '' ? ' [' + issue.cell + ']' : '') + ' → ' + issue.occupants))
        )
      }
      const totals = state.status === 'ready' ? state.snapshot.totals : null
      const statsText = totals === null ? '' : t('stats').replace('{nodes}', totals.nodes).replace('{plugins}', totals.plugins).replace('{enabled}', totals.enabled).replace('{edges}', totals.edges)

      if (!fullscreen) {
        return React.createElement('div', { className: 'dpt', ref: boxRef, 'aria-busy': state.status === 'loading' },
          React.createElement('div', { className: 'dpt-launch' },
            React.createElement('h3', null, t('tab')),
            state.status === 'loading' ? React.createElement('p', null, t('loading')) : null,
            state.status === 'error' ? React.createElement(React.Fragment, null,
              React.createElement('p', { role: 'alert' }, t('error')),
              React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: retry }, t('retry'))
            ) : null,
            state.status === 'ready' ? React.createElement('p', null, statsText + (totalIssues > 0 ? ' · ⚠ ' + totalIssues : '')) : null,
            state.status === 'ready' ? React.createElement('button', { type: 'button', className: 'dpt-open', onClick: props.onOpenFullscreen }, '⛶ ' + t('open')) : null,
            React.createElement('p', null, t('launchHint'))
          )
        )
      }

      return React.createElement('div', { className: 'dpt dpt-full', ref: boxRef, 'aria-busy': state.status === 'loading' },
        React.createElement('div', { className: 'dpt-bar' },
          React.createElement('label', { className: 'dpt-search' },
            React.createElement('input', { type: 'search', value: query, placeholder: t('search'), 'aria-label': t('search'), onChange: (e) => setQuery(e.currentTarget.value) })
          ),
          React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: retry }, t('refresh')),
          React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: relayout }, t('relayout')),
          React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: fit }, t('fit')),
          React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: props.onClose }, '✕ ' + t('close')),
          React.createElement('label', { className: 'dpt-check' },
            React.createElement('input', { type: 'checkbox', checked: highlight, onChange: (e) => setHighlight(e.currentTarget.checked) }),
            t('highlight')
          ),
          React.createElement('button', { type: 'button', className: totalIssues > 0 ? 'dpt-btn dpt-warn' : 'dpt-btn', onClick: () => setIssuesOpen((v) => !v) }, '⚠ ' + totalIssues),
          React.createElement('span', { className: 'dpt-layers' },
            LAYERS.map((layer) => React.createElement('button', { key: layer, type: 'button', className: 'dpt-layer', 'data-on': hiddenLayers.has(layer) ? 'false' : 'true', onClick: () => toggleLayer(layer) }, t(LAYER_LABEL[layer]) + ' ' + layerCounts[layer]))
          ),
          React.createElement('span', { className: 'dpt-stats' }, statsText)
        ),
        React.createElement('div', { className: 'dpt-legend' },
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-on' }), t('legendEnabled')),
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-loading' }), t('legendLoading')),
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-pending' }), t('legendPending')),
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-fail' }), t('legendFailed')),
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-off' }), t('legendDisabled')),
          React.createElement('span', null, React.createElement('i', { className: 'dpt-dot dpt-dot-idle' }), t('legendIdle')),
          React.createElement('span', { className: 'dpt-hint' }, t('hint'))
        ),
        state.status === 'loading' ? React.createElement('p', { className: 'dpt-summary' }, t('loading')) : null,
        state.status === 'error' ? React.createElement('div', null,
          React.createElement('p', { role: 'alert', className: 'dpt-summary' }, t('error')),
          React.createElement('button', { type: 'button', className: 'dpt-btn', onClick: retry }, t('retry'))
        ) : null,
        state.status === 'ready' && viewGraph !== null ? React.createElement('div', { className: 'dpt-body' },
          React.createElement('div', { className: 'dpt-canvas dpt-canvas-full' },
            React.createElement('canvas', { ref: canvasRef, onPointerDown, onPointerMove, onPointerUp, onPointerLeave }),
            viewGraph.nodes.length === 0 ? React.createElement('div', { className: 'dpt-canvas-message' }, t('empty')) : null,
            renderPanel(),
            renderIssues()
          )
        ) : null,
        hoverNode !== undefined ? React.createElement('div', { className: 'dpt-tip', ref: tipRef, style: { left: tipPosRef.current.x, top: tipPosRef.current.y } },
          React.createElement('b', null, titleOf(hoverNode)),
          React.createElement('span', null, hoverNode.moduleName || hoverNode.id),
          React.createElement('span', null, summaryOf(hoverNode, t)),
          hoverNode.missingServices !== undefined && hoverNode.missingServices.length > 0 ? React.createElement('span', { className: 'dpt-bad' }, t('missingServices') + ': ' + hoverNode.missingServices.join(', ')) : null,
          React.createElement('span', null, t('depBadge').replace('{out}', (viewGraph.consumes.get(hoverNode.id) || []).length).replace('{in}', (viewGraph.provides.get(hoverNode.id) || []).length) + ' · ' + t('clickHint'))
        ) : null
      )
    }

    function FullscreenOverlay(props) {
      const [open, setOpen] = React.useState(props.store.open)
      const dialogRef = React.useRef(null)
      React.useEffect(() => props.store.subscribe(() => setOpen(props.store.open)), [props.store])
      React.useEffect(() => {
        const dialog = dialogRef.current
        if (dialog === null) return undefined
        if (open) {
          try { if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal() } catch (error) {}
          return undefined
        }
        try { if (dialog.open && typeof dialog.close === 'function') dialog.close() } catch (error) {}
        return undefined
      }, [open])
      React.useEffect(() => () => {
        try {
          const dialog = dialogRef.current
          if (dialog !== null && dialog.open) dialog.close()
        } catch (error) {}
      }, [])
      const close = () => props.store.set(false)
      return React.createElement('dialog', {
        className: 'dpt-dialog',
        ref: dialogRef,
        'aria-label': props.t('overlayLabel'),
        onCancel: (e) => { e.preventDefault(); close() },
        onClick: (e) => { if (e.target === dialogRef.current) close() }
      },
        open ? React.createElement(GraphTab, { t: props.t, list: props.list, slotsApi: props.slotsApi, fullscreen: true, onClose: close }) : null
      )
    }

    exports.apply = function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return
      ctx.effect(() => insertCss(CSS), 'dsh-plugin-tree: styles')
      const locale = ctx.get('locale')
      let t
      if (locale !== undefined) {
        ctx.effect(() => locale.register(NS, { zh: ZH }), 'dsh-plugin-tree: dictionaries')
        t = locale.bind(NS)
      } else {
        t = (key) => ZH[key] || key
      }
      const remote = ctx.get('remote')
      const list = async () => {
        if (remote === undefined) throw new Error('remote service unavailable')
        const result = await remote.pluginTree.snapshot()
        if (!result.ok) throw new Error('pluginTree.snapshot failed: ' + (result.error && result.error.message ? result.error.message : 'unknown'))
        return result.value
      }
      const overlayStore = {
        open: false,
        listeners: new Set(),
        set(value) { if (this.open === value) return; this.open = value; for (const fn of this.listeners) fn() },
        subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
      }
      slots.inject('settings.plugins.tab', () => slots.register(
        { name: 'settings.plugins.tab', id: 'tree', order: 20, label: () => t('tab') },
        (props) => React.createElement(GraphTab, Object.assign({}, props, { list, t, slotsApi: slots, onOpenFullscreen: () => overlayStore.set(true) }))
      ))
      slots.inject('shell.overlay', () => slots.register(
        { name: 'shell.overlay', id: 'pdtree-fullscreen', order: 50, label: () => t('overlayLabel') },
        () => React.createElement(FullscreenOverlay, { store: overlayStore, t, list, slotsApi: slots })
      ))
    }
    return module.exports
  }
})
