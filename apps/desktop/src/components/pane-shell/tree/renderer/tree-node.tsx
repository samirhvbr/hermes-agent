import type { LayoutNode } from '../model'

import { TreeGroup } from './tree-group'
import { TreeSplit } from './tree-split'

/** Dispatch a layout node to its renderer — the split/group recursion point.
 *  `root` marks the tree's top split (side collapse applies only there).
 *  `parentAxis` is the containing split's orientation — a group collapses
 *  ALONG that axis, so it picks the minimized form (row → vertical rail,
 *  column → horizontal header). */
export function TreeNode({
  node,
  parentAxis,
  root
}: {
  node: LayoutNode
  parentAxis?: 'column' | 'row'
  root?: boolean
}) {
  return node.type === 'split' ? (
    <TreeSplit node={node} root={root} />
  ) : (
    <TreeGroup node={node} parentAxis={parentAxis} />
  )
}
