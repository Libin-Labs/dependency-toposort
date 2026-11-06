# @lp-labs/dependency-toposort

Stable dependency-first ordering for finite directed acyclic graphs, including independent execution
levels and concrete cycle paths. It computes graph order only; it is not a task scheduler.

## Install and use

```bash
npm install @lp-labs/dependency-toposort
```

```js
import { topologicalSort } from '@lp-labs/dependency-toposort';

const result = topologicalSort(
  ['app', 'compiler', 'schema'],
  new Map([
    ['app', ['compiler']],
    ['compiler', ['schema']],
  ]),
);
if (result.order.join(',') !== 'schema,compiler,app') throw new Error('Dependency order failed');
```

The package provides ESM/CommonJS entry points and declarations and has no runtime or peer dependencies.

## API

`topologicalSort(nodes, dependencies, options?): Topology<T>` accepts an ordered node list and a map
from each node to its dependencies. The result contains frozen dependency-first `order` and `levels`;
nodes in a level have no unresolved dependencies on one another. Each level preserves input-node
order. Duplicate dependency entries are ignored.

`Topology<T>` exposes `order` and `levels`. `DependencyCycleError<T>` extends `Error` and carries a
frozen `cycle` path whose first and final node are the same for detected cycles. Unknown dependency
nodes, duplicate input nodes, and self-loops are rejected, not silently added.

Options include `maxNodes` (default 100,000) and `maxEdges` (default 1,000,000). Duplicate edges do
not consume additional edge budget.

## Errors and customization

Malformed graph references throw `TypeError`; exceeded limits throw `RangeError`; cycles throw
`DependencyCycleError`. The input graph is read but never modified. The node identity contract is
JavaScript Map/Set identity, so object nodes must be the same object references in both arguments.
If a different tie-break order is needed, supply nodes in that order.

## Performance and scope

Graph construction and ordering are O(V + E) plus per-level stable sorting; memory is O(V + E).
Cycle extraction is iterative to support deep graphs. The result does not execute work, manage
concurrency, retry failed tasks, or detect changes to a graph after ordering.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
