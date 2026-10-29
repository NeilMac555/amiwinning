/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS smoke harness */
// Exercise the real store with synthetic history and a browser-sized quota.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/import/store.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
let stored = null;
let quota = 5 * 1024 * 1024;
const localStorage = {
  getItem: () => stored,
  setItem: (_key, value) => {
    if (value.length * 2 > quota) throw new Error('QuotaExceededError');
    stored = value;
  },
  removeItem: () => { stored = null; },
};
function freshStore() {
  const exports = {};
  vm.runInNewContext(code, {
    exports, window: { localStorage },
    require: (name) => name === '../bet-sync' ? {} : require(name),
  });
  return exports;
}
const store = freshStore();
const history = Array.from({ length: 10000 }, (_, i) => ({
  id: `synthetic-${i}`, bookId: `book-${i % 4}`, kickoff: '2026-10-28',
  sport: 'Tennis', event: `Borges vs Ruud ${i}`, selection: 'Over 22.5 Games',
  odds: 1.87, stake: 2, status: 'won', pl: 1.74,
  source: 'manual', importedAt: '2026-10-29T00:00:00Z',
  notes: 'Unicode: é 日本語 ⚽', raw: { input: `Original input ${i}: ` + 'bet detail '.repeat(30) },
  ...(i === 0 ? { _pending: true } : {}),
  ...(i === 1 ? { _pendingDelete: true } : {}),
}));
// Upgrade from a full legacy cache without discarding a single field.
stored = JSON.stringify(history);
assert.ok(stored.length * 2 > quota);
assert.equal(JSON.stringify(store.loadBetsRaw()), stored);
store.saveBets(history);
assert.ok(stored.startsWith('lz16:'));
assert.equal(JSON.stringify(freshStore().loadBetsRaw()), JSON.stringify(history));
assert.equal(store.loadBets().length, 9999);
// Downloaded remote bets become visible after saving the larger merged cache.
const added = Array.from({ length: 6 }, (_, i) => ({ ...history[2], id: `new-${i}` }));
store.saveBets([...history, ...added]);
assert.equal(store.loadBetsRaw().length, 10006);
assert.equal(store.loadBets().filter(b => b.id.startsWith('new-')).length, 6);
// A genuinely full store must throw and retain the previous durable cache.
const beforeFailure = stored;
quota = 1;
assert.throws(() => store.saveBets([...history, ...added]), /QuotaExceededError/);
assert.equal(stored, beforeFailure);
console.log(`PASS: lossless 10,006-row reload, legacy upgrade, pending flags, six new rows, atomic quota failure. Cache ${(stored.length * 2 / 1024 / 1024).toFixed(2)} MiB.`);
