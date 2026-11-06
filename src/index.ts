export interface Topology<T> {
  readonly order: readonly T[];
  readonly levels: readonly (readonly T[])[];
}
export class DependencyCycleError<T> extends Error {
  readonly cycle: readonly T[];
  constructor(cycle: readonly T[]) {
    super(`Dependency cycle: ${cycle.map(String).join(' -> ')}`);
    this.name = 'DependencyCycleError';
    this.cycle = Object.freeze([...cycle]);
  }
}
export function topologicalSort<T>(
  nodes: readonly T[],
  dependencies: ReadonlyMap<T, readonly T[]>,
  options: { readonly maxNodes?: number; readonly maxEdges?: number } = {},
): Topology<T> {
  if (nodes.length > (options.maxNodes ?? 100_000)) throw new RangeError('Node limit exceeded');
  const index = new Map<T, number>();
  nodes.forEach((node, at) => {
    if (index.has(node)) throw new TypeError(`Duplicate node: ${String(node)}`);
    index.set(node, at);
  });
  const indegree = new Map<T, number>();
  const dependents = new Map<T, T[]>();
  for (const node of nodes) {
    indegree.set(node, 0);
    dependents.set(node, []);
  }
  let edgeCount = 0;
  for (const node of nodes) {
    const unique = new Set<T>();
    for (const dependency of dependencies.get(node) ?? []) {
      if (!index.has(dependency))
        throw new TypeError(`Unknown dependency ${String(dependency)} of ${String(node)}`);
      if (dependency === node) throw new DependencyCycleError([node, node]);
      if (unique.has(dependency)) continue;
      unique.add(dependency);
      if (++edgeCount > (options.maxEdges ?? 1_000_000))
        throw new RangeError('Edge limit exceeded');
      indegree.set(node, indegree.get(node)! + 1);
      dependents.get(dependency)!.push(node);
    }
  }
  const ready = nodes.filter((node) => indegree.get(node) === 0);
  const order: T[] = [];
  const levels: T[][] = [];
  const scheduled = new Set(ready);
  while (ready.length > 0) {
    const current = ready.splice(0, ready.length);
    levels.push(current);
    const newlyReady: T[] = [];
    for (const node of current) {
      order.push(node);
      for (const dependent of dependents.get(node)!) {
        const remaining = indegree.get(dependent)! - 1;
        indegree.set(dependent, remaining);
        if (remaining === 0 && !scheduled.has(dependent)) {
          newlyReady.push(dependent);
          scheduled.add(dependent);
        }
      }
    }
    newlyReady.sort((a, b) => index.get(a)! - index.get(b)!);
    ready.push(...newlyReady);
  }
  if (order.length !== nodes.length) {
    const remaining = new Set(nodes.filter((node) => indegree.get(node)! > 0));
    const state = new Map<T, 0 | 1 | 2>();
    const path: T[] = [];
    for (const start of nodes) {
      if (!remaining.has(start) || state.has(start)) continue;
      state.set(start, 1);
      path.push(start);
      const stack = [{ node: start, at: 0, dependencies: dependencies.get(start) ?? [] }];
      while (stack.length > 0) {
        const frame = stack[stack.length - 1]!;
        if (frame.at >= frame.dependencies.length) {
          state.set(frame.node, 2);
          stack.pop();
          path.pop();
          continue;
        }
        const dependency = frame.dependencies[frame.at++]!;
        if (!remaining.has(dependency)) continue;
        const color = state.get(dependency) ?? 0;
        if (color === 1)
          throw new DependencyCycleError([...path.slice(path.indexOf(dependency)), dependency]);
        if (color === 0) {
          state.set(dependency, 1);
          path.push(dependency);
          stack.push({ node: dependency, at: 0, dependencies: dependencies.get(dependency) ?? [] });
        }
      }
    }
    throw new DependencyCycleError([...remaining]);
  }
  return Object.freeze({
    order: Object.freeze(order),
    levels: Object.freeze(levels.map((level) => Object.freeze(level))),
  });
}
