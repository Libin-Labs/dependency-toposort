import test from 'node:test';
import assert from 'node:assert/strict';
import { DependencyCycleError, topologicalSort } from '../dist/esm/index.js';
test('produces stable dependency-first order and parallel levels', () => {
  const result = topologicalSort(
    ['app', 'b', 'a', 'shared'],
    new Map([
      ['app', ['a', 'b']],
      ['a', ['shared']],
      ['b', ['shared']],
    ]),
  );
  assert.deepEqual(result.order, ['shared', 'b', 'a', 'app']);
  assert.deepEqual(result.levels, [['shared'], ['b', 'a'], ['app']]);
});
test('accepts isolated nodes and empty graphs', () => {
  assert.deepEqual(topologicalSort(['a', 'b'], new Map()).levels, [['a', 'b']]);
  assert.deepEqual(topologicalSort([], new Map()).order, []);
});
test('deduplicates repeated dependency declarations', () => {
  assert.deepEqual(topologicalSort(['a', 'b'], new Map([['b', ['a', 'a']]])).order, ['a', 'b']);
});
test('reports unknown and duplicate nodes', () => {
  assert.throws(() => topologicalSort(['a'], new Map([['a', ['missing']]])), /Unknown dependency/);
  assert.throws(() => topologicalSort(['a', 'a'], new Map()), /Duplicate node/);
});
test('returns a concrete cycle path', () => {
  assert.throws(
    () =>
      topologicalSort(
        ['a', 'b', 'c'],
        new Map([
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['a']],
        ]),
      ),
    (error) => {
      assert.ok(error instanceof DependencyCycleError);
      assert.deepEqual(error.cycle, ['a', 'b', 'c', 'a']);
      return true;
    },
  );
});
test('reports self cycles and enforces graph limits', () => {
  assert.throws(() => topologicalSort(['a'], new Map([['a', ['a']]])), DependencyCycleError);
  assert.throws(() => topologicalSort(['a', 'b'], new Map(), { maxNodes: 1 }), RangeError);
  assert.throws(
    () => topologicalSort(['a', 'b'], new Map([['b', ['a']]]), { maxEdges: 0 }),
    RangeError,
  );
});
test('handles a deep chain without recursive traversal', () => {
  const nodes = Array.from({ length: 3000 }, (_, i) => i);
  const dependencies = new Map(nodes.slice(1).map((i) => [i, [i - 1]]));
  assert.equal(topologicalSort(nodes, dependencies).order.length, nodes.length);
});
