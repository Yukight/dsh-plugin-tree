/**
 * dsh-plugin-tree — host half.
 * Publishes the `pluginTree` typert remote service whose `snapshot()` projects
 * the live Cordis loader tree (groups + isolate subtrees), runtime service
 * dependency edges (consumer -> provider, from active fibers' service stores),
 * per-node missing-service analysis, and process-local dynamic Cordis plugins.
 */
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

const ENTRY = Symbol.for('cordis.entry')
const PHASE = ['pending', 'loading', 'active', 'failed', null, 'unloading']
const ACTIVE = 2
const SEP = '|'

function safe(fn, fallback) {
  try {
    const value = fn()
    return value === undefined ? fallback : value
  } catch (error) {
    return fallback
  }
}

function stringKeys(value, limit) {
  const keys = []
  if (value !== null && typeof value === 'object') {
    try {
      for (const key of Object.keys(value)) {
        if (typeof key === 'string' && key !== '' && keys.indexOf(key) === -1) keys.push(key)
        if (keys.length >= limit) break
      }
    } catch (error) {}
  }
  return keys
}

function phaseOf(entry) {
  return safe(() => {
    const fiber = entry.fiber
    if (fiber === null || fiber === undefined) return null
    const state = fiber.state
    if (typeof state !== 'number' || state < 0 || state >= PHASE.length) return 'unknown'
    return PHASE[state]
  }, null)
}

function injectNames(entry) {
  const names = []
  const add = (list) => {
    if (!Array.isArray(list)) return
    for (const name of list) if (typeof name === 'string' && name !== '' && names.indexOf(name) === -1) names.push(name)
  }
  add(safe(() => {
    const fiber = entry.fiber
    return fiber === null || fiber === undefined ? [] : stringKeys(fiber.inject, 64)
  }, []))
  add(safe(() => {
    const inject = entry.options && entry.options.inject
    if (Array.isArray(inject)) return inject
    if (inject !== null && typeof inject === 'object') return stringKeys(inject, 64)
    return []
  }, []))
  return names
}

function entryIdOfFiber(fiber) {
  if (fiber === null || fiber === undefined) return undefined
  const seen = new Set()
  let current = fiber
  for (let step = 0; step < 32 && current !== null && current !== undefined && !seen.has(current); step++) {
    seen.add(current)
    const own = safe(() => current.entry, undefined)
    if (own !== undefined && own !== null) return safe(() => String(own.id), undefined)
    const parent = safe(() => current.parent, undefined)
    if (parent === null || parent === undefined) return undefined
    const tagged = safe(() => parent[ENTRY], undefined)
    if (tagged !== undefined && tagged !== null) return safe(() => String(tagged.id), undefined)
    current = safe(() => parent.fiber, undefined)
  }
  return undefined
}

function entryName(entry) {
  return safe(() => String((entry.options && entry.options.name) || ''), '')
}

function displayNameOf(entry) {
  return safe(() => {
    const fiber = entry.fiber
    if (fiber === null || fiber === undefined) return ''
    const runtime = fiber.runtime
    if (runtime !== null && runtime !== undefined && typeof runtime.name === 'string' && runtime.name !== '') return runtime.name
    return typeof fiber.name === 'string' ? fiber.name : ''
  }, '')
}

export function buildSnapshot(ctx) {
  const loader = ctx.get('loader')
  if (loader === undefined) {
    return { nodes: [], edges: [], totals: { nodes: 0, plugins: 0, enabled: 0, edges: 0, missing: 0 }, serviceProviders: {} }
  }

  const nodes = []
  const index = new Map()
  const rows = []
  const outerEntries = new Map()

  for (const entry of loader.entries()) {
    const id = safe(() => String(entry.id), '')
    if (id === '') continue
    const parent = safe(() => {
      const group = entry.parent
      if (group === null || group === undefined) return undefined
      const groupCtx = group.ctx
      if (groupCtx === null || groupCtx === undefined) return undefined
      const fiber = groupCtx.fiber
      if (fiber === null || fiber === undefined) return undefined
      return fiber.entry
    }, undefined)
    const parentId = parent === null || parent === undefined ? null : safe(() => String(parent.id), null)
    if (parent !== null && parent !== undefined && parentId !== null && parentId !== '' && !outerEntries.has(parentId)) {
      outerEntries.set(parentId, parent)
    }
    const isGroup = safe(() => Boolean(entry.options && entry.options.group), false)
    let childCount = 0
    safe(() => {
      const subgroup = entry.subgroup
      if (subgroup !== null && subgroup !== undefined && Array.isArray(subgroup.data)) childCount = subgroup.data.length
    }, 0)
    if (childCount === 0) {
      safe(() => {
        const subtree = entry.subtree
        if (subtree !== null && subtree !== undefined && subtree.store) childCount = Object.keys(subtree.store).length
      }, 0)
    }
    const node = {
      id,
      moduleName: entryName(entry),
      displayName: displayNameOf(entry),
      parentId,
      isGroup,
      disabledOwn: safe(() => Boolean(entry.options && entry.options.disabled), false),
      enabled: safe(() => !entry.disabled, false),
      phase: phaseOf(entry),
      inject: injectNames(entry),
      configKeys: safe(() => stringKeys(entry.options && entry.options.config, 12), []),
      childCount,
      external: false,
    }
    nodes.push(node)
    index.set(id, node)
    rows.push({ id, entry })
  }

  for (const [outerId, outer] of outerEntries) {
    if (index.has(outerId)) continue
    const node = {
      id: outerId,
      moduleName: entryName(outer),
      displayName: displayNameOf(outer),
      parentId: null,
      isGroup: true,
      disabledOwn: safe(() => Boolean(outer.options && outer.options.disabled), false),
      enabled: safe(() => !outer.disabled, true),
      phase: phaseOf(outer),
      inject: [],
      configKeys: [],
      childCount: safe(() => {
        const subtree = outer.subtree
        return subtree !== null && subtree !== undefined && subtree.store ? Object.keys(subtree.store).length : 0
      }, 0),
      external: true,
    }
    nodes.unshift(node)
    index.set(outerId, node)
  }

  const dynGroupId = 'dyn-plugins'
  const dynNodes = []
  const runner = safe(() => ctx.get('dynamicCordisRunner'), undefined)
  if (runner !== undefined) {
    const registry = safe(() => runner.registry, undefined)
    const all = safe(() => (registry !== undefined && registry !== null && typeof registry.all === 'function' ? registry.all() : undefined), undefined)
    if (Array.isArray(all)) {
      for (const plugin of all) {
        const pluginId = safe(() => String(plugin.pluginId), '')
        if (pluginId === '') continue
        const running = safe(() => plugin.run !== undefined, false)
        const pkgId = safe(() => (plugin.currentPackageId !== undefined && plugin.currentPackageId !== null ? String(plugin.currentPackageId) : null), null)
        let displayName = pluginId
        safe(() => {
          const packages = plugin.packages
          const key = pkgId !== null ? pkgId : [...packages.keys()].at(-1)
          const def = key !== undefined ? packages.get(key) : undefined
          if (def !== undefined && typeof def.name === 'string' && def.name !== '') displayName = def.name
        }, undefined)
        dynNodes.push({
          id: 'dyn/' + pluginId,
          moduleName: 'cordis-dynamic · ' + (pkgId !== null ? pkgId : 'inactive'),
          displayName,
          parentId: dynGroupId,
          isGroup: false,
          disabledOwn: !running,
          enabled: running,
          phase: running ? 'active' : null,
          inject: [],
          configKeys: [],
          childCount: 0,
          external: false,
          dynamic: true,
        })
      }
    }
  }
  if (dynNodes.length > 0) {
    const groupNode = {
      id: dynGroupId,
      moduleName: 'cordis-dynamic',
      displayName: 'dynamic',
      parentId: null,
      isGroup: true,
      disabledOwn: false,
      enabled: true,
      phase: 'active',
      inject: [],
      configKeys: [],
      childCount: dynNodes.length,
      external: false,
      dynamic: true,
    }
    nodes.push(groupNode)
    index.set(dynGroupId, groupNode)
    for (const dynNode of dynNodes) {
      nodes.push(dynNode)
      index.set(dynNode.id, dynNode)
    }
  }

  const edges = []
  const edgeKeys = new Set()
  for (const row of rows) {
    safe(() => {
      const fiber = row.entry.fiber
      if (fiber === null || fiber === undefined || fiber.state !== ACTIVE) return
      const store = fiber.store
      if (store === null || store === undefined || typeof store !== 'object') return
      for (const service of stringKeys(store, 96)) {
        let impl
        try { impl = store[service] } catch (error) { continue }
        if (impl === null || impl === undefined || typeof impl !== 'object') continue
        const providerId = entryIdOfFiber(impl.fiber)
        if (providerId === undefined || providerId === null || providerId === row.id || !index.has(providerId)) continue
        const key = row.id + SEP + providerId + SEP + service
        if (edgeKeys.has(key)) continue
        edgeKeys.add(key)
        edges.push({ from: row.id, to: providerId, service: String(service) })
      }
    }, undefined)
  }

  const provided = new Set()
  const serviceProviders = {}
  for (const row of rows) {
    safe(() => {
      const fiber = row.entry.fiber
      if (fiber === null || fiber === undefined || fiber.state !== ACTIVE) return
      const store = fiber.store
      if (store === null || store === undefined || typeof store !== 'object') return
      for (const service of stringKeys(store, 96)) {
        provided.add(service)
        if (!(service in serviceProviders)) {
          let impl
          try { impl = store[service] } catch (error) { impl = undefined }
          const providerId = impl !== undefined && impl !== null ? entryIdOfFiber(impl.fiber) : undefined
          serviceProviders[service] = providerId === undefined || providerId === null ? 'framework' : providerId
        }
      }
    }, undefined)
  }
  const declared = new Set()
  for (const node of nodes) for (const name of node.inject) declared.add(name)
  for (const name of declared) {
    if (provided.has(name)) continue
    safe(() => { if (ctx.get(name) !== undefined) provided.add(name) }, undefined)
  }
  let missingCount = 0
  for (const node of nodes) {
    node.missingServices = node.inject.filter((name) => !provided.has(name))
    if (node.missingServices.length > 0) missingCount += 1
  }

  const totals = {
    nodes: nodes.length,
    plugins: nodes.reduce((sum, node) => sum + (node.isGroup ? 0 : 1), 0),
    enabled: nodes.reduce((sum, node) => sum + (node.enabled ? 1 : 0), 0),
    edges: edges.length,
    missing: missingCount,
  }
  return { nodes, edges, totals, serviceProviders }
}

export class PluginTreeGateway extends TypertRemoteService {
  static inject = ['loader']
  constructor(ctx) {
    super(ctx, 'pluginTree')
  }
  snapshot() {
    return buildSnapshot(this.ctx)
  }
}

export default PluginTreeGateway
