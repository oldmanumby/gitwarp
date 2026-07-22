import test from 'node:test';
import assert from 'node:assert/strict';
import { runEmpiricalHarness } from './stress_harness.js';

test('Empirical Challenger M1.2 - 1,000 Randomized URLs & Equivalence Verification', async (t) => {
  await t.test('verifies parseGithubUrl performance and property consistency across 1,000+ randomized URLs', () => {
    const stats = runEmpiricalHarness();

    assert.equal(stats.totalUrlsTested, 1050, 'Must test 1050 URLs');
    assert.equal(stats.violationsCount, 0, 'Must have zero property violations');
    assert.equal(stats.isValidEquivalenceFailures, 0, 'isValidGithubUrl must be 100% equivalent to parseGithubUrl().valid');
    assert.equal(stats.extractRepoPathEquivalenceFailures, 0, 'extractRepoPath must be 100% equivalent to parsed.owner/parsed.repo or null');
    assert.ok(stats.avgParseUs < 50, `Average parse time per URL should be under 50us (got ${stats.avgParseUs}us)`);
    assert.ok(stats.opsPerSec > 10000, `Throughput should exceed 10,000 ops/sec (got ${stats.opsPerSec} ops/sec)`);
  });
});
