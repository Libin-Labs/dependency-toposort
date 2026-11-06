import { DependencyCycleError, topologicalSort, type Topology } from '@lp-labs/dependency-toposort';
const topology: Topology<string> = topologicalSort(['a'], new Map());
const error: DependencyCycleError<string> = new DependencyCycleError(['a', 'a']);
// @ts-expect-error nodes and dependencies must use a consistent generic type.
topologicalSort([1], new Map<string, readonly string[]>());
void [topology, error];
