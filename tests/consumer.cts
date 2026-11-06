import { topologicalSort } from '@lp-labs/dependency-toposort';
const result = topologicalSort([1, 2], new Map([[2, [1]]]));
const first: number = result.order[0]!;
// @ts-expect-error dependency values must be numeric.
topologicalSort([1], new Map([[1, ['one']]]));
void first;
