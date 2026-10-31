import { KIND_LABEL, STATUS_LABEL, type Kind, type Node } from './types';

export function childrenOf(nodes: Node[], parentId: string | null, kind?: Kind): Node[] {
  return nodes
    .filter((n) => n.parentId === parentId && (!kind || n.kind === kind))
    .sort((a, b) => a.order - b.order);
}

export function descendantIds(nodes: Node[], id: string): string[] {
  const out: string[] = [];
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    out.push(cur);
    for (const n of nodes) if (n.parentId === cur) queue.push(n.id);
  }
  return out;
}

export function ancestors(nodes: Node[], id: string): Node[] {
  const out: Node[] = [];
  let cur = nodes.find((n) => n.id === id);
  while (cur?.parentId) {
    cur = nodes.find((n) => n.id === cur!.parentId);
    if (cur) out.unshift(cur);
  }
  return out;
}

/** Finished vs total of the unit one level down that counts as "done" for this node. */
export function progress(nodes: Node[], node: Node): { done: number; total: number } {
  const unit: Kind = node.kind === 'episode' ? 'clip' : 'episode';
  const ids = new Set(descendantIds(nodes, node.id));
  const items = nodes.filter((n) => n.kind === unit && ids.has(n.id) && n.status !== 'shelved');
  return { done: items.filter((n) => n.status === 'wrapped').length, total: items.length };
}

/** Plain-text outline of a subtree, used as context for the AI writers' room. */
export function outline(nodes: Node[], rootId: string, depth = 0): string {
  const node = nodes.find((n) => n.id === rootId);
  if (!node) return '';
  const notes = node.notes ? ` — ${node.notes.replace(/\s+/g, ' ').slice(0, 200)}` : '';
  const line = `${'  '.repeat(depth)}- [${STATUS_LABEL[node.status]}] ${KIND_LABEL[node.kind]}: ${node.title}${notes} (updated ${node.updatedAt.slice(0, 10)})`;
  const kids = childrenOf(nodes, node.id).map((c) => outline(nodes, c.id, depth + 1));
  return [line, ...kids].join('\n');
}
