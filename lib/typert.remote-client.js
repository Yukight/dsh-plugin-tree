/* Hand-written typert remote-client contribution for dsh-plugin-tree (mirrors generated shape). */
import { z } from 'zod'

const dsh_plugin_tree_pluginTree_snapshot_result$schema = z.any()

export const TYPERT_REMOTE = {
  package: 'dsh-plugin-tree',
  descriptors: [
    {
      id: 'dsh-plugin-tree#pluginTree/snapshot',
      service: 'pluginTree',
      namespace: 'pluginTree',
      method: 'snapshot',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-plugin-tree/types#TreeSnapshot',
        schema: dsh_plugin_tree_pluginTree_snapshot_result$schema,
      },
      sourceLocation: { file: 'lib/index.js', line: 1, column: 1 },
    },
  ],
}

export default TYPERT_REMOTE
