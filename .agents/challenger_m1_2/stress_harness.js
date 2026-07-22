import { parseGithubUrl, isValidGithubUrl, extractRepoPath, normalizeGithubUrl } from '../../src/parser.js';

// Seeded PRNG (Mulberry32) for reproducible randomized URL generation
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(424242);

function choice(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randHex(len) {
  const chars = '0123456789abcdef';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars[Math.floor(rand() * chars.length)];
  }
  return res;
}

const USERNAMES = ['octocat', 'torvalds', 'gaearon', 'sindresorhus', 'tj', 'facebook', 'google', 'vercel', 'microsoft', 'apple', 'a-b-c', 'user123', 'CamelCaseUser'];
const REPOS = ['Spoon-Knife', 'react', 'linux', 'node', 'next.js', 'vscode', 'gitswapForged', 'my-repo_name', 'repo.js', 'repo.git', 'CamelCaseRepo'];
const REFS = ['main', 'master', 'dev', 'v1.0.0', 'feature/test-branch', 'patch-1', '70b0213', '4b825dc642cb6eb9a060e54bf8d69288fbee4904'];
const FILEPATHS = ['README.md', 'src/index.js', 'package.json', 'docs/api/v1/spec.yaml', 'assets/logo.png', 'lib/core/utils/parser.ts'];
const SCHEMES = ['https://', 'http://', ''];
const DOMAINS = ['github.com', 'www.github.com', 'raw.githubusercontent.com', 'github.dev', 'github1s.com'];
const RESERVED = ['about', 'apps', 'blog', 'careers', 'contact', 'customer-stories', 'enterprise', 'explore', 'features', 'join', 'login', 'marketplace', 'notifications', 'orgs', 'press', 'pricing', 'search', 'security', 'settings', 'signup', 'site', 'sponsors', 'stars', 'topics', 'trending'];
const INVALID_DOMAINS = ['gitlab.com', 'bitbucket.org', 'google.com', 'fakegithub.com', 'github.com.attacker.com', 'github.org'];

function generateRandomUrls(count = 1000) {
  const urls = [];

  for (let i = 0; i < count; i++) {
    const category = randInt(1, 6);
    const scheme = choice(SCHEMES);
    const domain = choice(DOMAINS);
    const owner = choice(USERNAMES);
    const repo = choice(REPOS);
    const ref = choice(REFS);
    const file = choice(FILEPATHS);

    let url;

    switch (category) {
      case 1: { // User Context
        const isReserved = rand() < 0.25;
        const u = isReserved ? choice(RESERVED) : owner;
        const trailing = rand() < 0.3 ? '/' : '';
        const q = rand() < 0.2 ? '?tab=repositories' : '';
        url = `${scheme}${domain}/${u}${trailing}${q}`;
        break;
      }
      case 2: { // Repo Context
        const sub = choice(['', '/tree/main', '/tree/v2.0', '/issues', '/pulls', '/actions', '/wiki', '/releases']);
        const trailing = rand() < 0.2 ? '/' : '';
        const dotGit = rand() < 0.25 ? '.git' : '';
        const q = rand() < 0.2 ? '?q=is%3Aopen' : '';
        url = `${scheme}${domain}/${owner}/${repo}${dotGit}${sub}${trailing}${q}`;
        break;
      }
      case 3: { // File Context
        const hashType = randInt(0, 4);
        let hash = '';
        if (hashType === 1) hash = `#L${randInt(1, 100)}`;
        else if (hashType === 2) hash = `#L${randInt(1, 50)}-L${randInt(51, 150)}`;
        else if (hashType === 3) hash = `#L${randInt(1, 10)}C1-L${randInt(11, 20)}C5`;
        else if (hashType === 4) hash = `#section-header-${randInt(1, 10)}`;

        const q = rand() < 0.3 ? '?plain=1&w=1' : '';
        
        if (domain === 'raw.githubusercontent.com') {
          url = `https://${domain}/${owner}/${repo}/${ref}/${file}${q}${hash}`;
        } else {
          const mode = choice(['blob', 'raw', 'tree']);
          url = `${scheme}${domain}/${owner}/${repo}/${mode}/${ref}/${file}${q}${hash}`;
        }
        break;
      }
      case 4: { // Commit Context
        const sha = rand() < 0.5 ? randHex(40) : randHex(7);
        const hash = rand() < 0.3 ? `#diff-${randHex(10)}` : '';
        url = `${scheme}${domain}/${owner}/${repo}/commit/${sha}${hash}`;
        break;
      }
      case 5: { // PR Context
        const prNum = randInt(1, 9999);
        const sub = choice(['', '/files', '/commits', '/checks']);
        const q = rand() < 0.3 ? '?w=1' : '';
        const mode = choice(['pull', 'pulls']);
        url = `${scheme}${domain}/${owner}/${repo}/${mode}/${prNum}${sub}${q}`;
        break;
      }
      case 6: default: { // Invalid / Edge Case / Fuzzing
        const invalidType = randInt(1, 12);
        if (invalidType === 1) url = `https://${choice(INVALID_DOMAINS)}/${owner}/${repo}`;
        else if (invalidType === 2) url = '';
        else if (invalidType === 3) url = '   \t\n   ';
        else if (invalidType === 4) url = null;
        else if (invalidType === 5) url = undefined;
        else if (invalidType === 6) url = randInt(1000, 9999);
        else if (invalidType === 7) url = { toString: () => 'https://github.com/owner/repo' };
        else if (invalidType === 8) url = `https://github.com/`;
        else if (invalidType === 9) url = `https://raw.githubusercontent.com/${owner}`;
        else if (invalidType === 10) url = `https://github.com/:::invalid-url-path:::`;
        else if (invalidType === 11) url = `https://github.com/${choice(RESERVED)}/${repo}`;
        else if (invalidType === 12) url = `ftp://github.com/${owner}/${repo}`;
        break;
      }
    }

    if (typeof url === 'string' && rand() < 0.1) {
      url = `  ${url}  `;
    }

    urls.push(url);
  }

  return urls;
}

// 50 Explicit Hard Adversarial Edge Cases
function getAdversarialEdgeCases() {
  return [
    'https://user:pass@github.com/octocat/Spoon-Knife',
    'https://GITHUB.COM/OCTOCAT/SPOON-KNIFE',
    'https://github.com/octocat/Spoon-Knife.git',
    'https://github.com/octocat/Spoon-Knife.git/blob/main/README.md',
    'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/src/index.ts#L100-L200',
    'https://github.com/octocat/Spoon-Knife/blob/main/file.js#L50-L10',
    'https://github.com/octocat/Spoon-Knife/blob/main/file.js#L0-L0',
    'https://github.com/octocat/Spoon-Knife/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'https://github.com/octocat/Spoon-Knife/pull/42/files?w=1#diff-12345',
    'https://github.com/settings/profile',
    'https://github.com/explore',
    'https://github.com/orgs/github/dashboard',
    'https://github.dev/octocat/Spoon-Knife',
    'https://github1s.com/octocat/Spoon-Knife',
    'https://www.github.com/octocat/Spoon-Knife',
    'github.com/octocat/Spoon-Knife',
    'http://github.com/octocat/Spoon-Knife',
    'https://github.com/octocat/Spoon-Knife/tree/feature/nested/branch/name',
    'https://github.com/octocat/Spoon-Knife/blob/feature/nested/branch/name/src/nested/file.js',
    'https://github.com/octocat/Spoon-Knife/pull/123/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'https://raw.githubusercontent.com/octocat/Spoon-Knife/main', // missing file (3 segments) -> valid raw file with filePath null
    'https://raw.githubusercontent.com/octocat/Spoon-Knife', // 2 segments -> invalid
    'https://github.com/octocat',
    'https://github.com/octocat/',
    'https://github.com',
    'https://github.com/',
    'https://gitlab.com/owner/repo',
    'https://github.com.attacker.com/owner/repo',
    'javascript:alert(1)',
    'https://github.com/owner/repo/pull/',
    'https://github.com/owner/repo/commit/',
    'https://github.com/owner/repo/tree/',
    'https://github.com/owner/repo/blob/',
    'https://github.com/owner/repo/raw/',
    'https://github.com/' + 'a/'.repeat(500) + 'b',
    'https://github.com/owner/repo/blob/main/' + 'x'.repeat(10000),
    'https://github.com/owner/repo?foo=bar&baz=qux#L10',
    'https://github.com/owner/repo/blob/main/test.js#L10C1-L20C30',
    'https://github.com/owner/repo/blob/main/test.js#L999999999999999999999',
    'https://github.com/owner/repo/blob/main/test.js#invalid-hash',
    '',
    '   ',
    null,
    undefined,
    12345,
    true,
    false,
    {},
    [],
    Symbol('url')
  ];
}

export function runEmpiricalHarness() {
  const randomizedUrls = generateRandomUrls(1000);
  const edgeCases = getAdversarialEdgeCases();
  const allUrls = [...randomizedUrls, ...edgeCases];

  console.log(`Starting Empirical Stress Harness across ${allUrls.length} total URLs (${randomizedUrls.length} randomized + ${edgeCases.length} adversarial edge cases)...`);

  let totalParseTimeNs = 0n;
  let validCount = 0;
  let invalidCount = 0;
  
  const contextCounts = { User: 0, Repo: 0, File: 0, Commit: 0, PR: 0, Unknown: 0 };
  const violations = [];
  let isValidEquivalenceFailures = 0;
  let extractRepoPathEquivalenceFailures = 0;
  let normalizeEquivalenceFailures = 0;

  const startTotal = process.hrtime.bigint();

  for (let i = 0; i < allUrls.length; i++) {
    const input = allUrls[i];

    // Measure parseGithubUrl performance
    const t0 = process.hrtime.bigint();
    let result;
    try {
      result = parseGithubUrl(input);
    } catch (err) {
      violations.push({ index: i, input: String(input), rule: 'UnhandledException', details: err.message });
      continue;
    }
    const t1 = process.hrtime.bigint();
    totalParseTimeNs += (t1 - t0);

    // Measure helpers
    let isValid, repoPath, normalized;
    try {
      isValid = isValidGithubUrl(input);
      repoPath = extractRepoPath(input);
      normalized = normalizeGithubUrl(input);
    } catch (err) {
      violations.push({ index: i, input: String(input), rule: 'HelperException', details: err.message });
      continue;
    }

    // Context count
    if (result.context in contextCounts) {
      contextCounts[result.context]++;
    }
    if (result.valid) validCount++;
    else invalidCount++;

    // --- PROPERTY INVARIANT CHECKS ---

    // 1. Immutability Check
    if (!Object.isFrozen(result)) {
      violations.push({ index: i, input: String(input), rule: 'Immutability', details: 'parseGithubUrl result object is not frozen' });
    }
    if (!Object.isFrozen(result.queryParams)) {
      violations.push({ index: i, input: String(input), rule: 'Immutability', details: 'queryParams object is not frozen' });
    }

    // 2. Type integrity
    if (typeof result.valid !== 'boolean') {
      violations.push({ index: i, input: String(input), rule: 'TypeIntegrity', details: 'valid property is not a boolean' });
    }
    if (typeof result.isRaw !== 'boolean') {
      violations.push({ index: i, input: String(input), rule: 'TypeIntegrity', details: 'isRaw property is not a boolean' });
    }
    if (typeof result.rawUrl !== 'string') {
      violations.push({ index: i, input: String(input), rule: 'TypeIntegrity', details: 'rawUrl property is not a string' });
    }

    // 3. Valid state consistency
    if (result.valid) {
      if (!['User', 'Repo', 'File', 'Commit', 'PR'].includes(result.context)) {
        violations.push({ index: i, input: String(input), rule: 'ValidConsistency', details: `Invalid context for valid URL: ${result.context}` });
      }
      if (!['user', 'repo', 'file', 'commit', 'pr'].includes(result.type)) {
        violations.push({ index: i, input: String(input), rule: 'ValidConsistency', details: `Invalid type for valid URL: ${result.type}` });
      }
      if (typeof result.owner !== 'string' || result.owner.length === 0) {
        violations.push({ index: i, input: String(input), rule: 'ValidConsistency', details: `Valid URL must have non-empty owner string: ${result.owner}` });
      }
      if (typeof result.normalizedUrl !== 'string' || !result.normalizedUrl.startsWith('https://github.com/')) {
        violations.push({ index: i, input: String(input), rule: 'ValidConsistency', details: `Valid URL must have canonical normalizedUrl: ${result.normalizedUrl}` });
      }
    } else {
      // 4. Invalid state consistency
      if (result.context !== 'Unknown' || result.type !== 'unknown') {
        violations.push({ index: i, input: String(input), rule: 'InvalidConsistency', details: `Invalid result must have Unknown/unknown context/type` });
      }
      if (result.owner !== null || result.repo !== null || result.ref !== null || result.filePath !== null || result.path !== null || result.commitHash !== null || result.commitSha !== null || result.prNumber !== null || result.lineStart !== null || result.lineEnd !== null || result.isRaw !== false || result.normalizedUrl !== null) {
        violations.push({ index: i, input: String(input), rule: 'InvalidConsistency', details: `Invalid result has non-null fields` });
      }
    }

    // 5. Field Relationship Consistency
    if (result.commitHash !== result.commitSha) {
      violations.push({ index: i, input: String(input), rule: 'FieldRelationship', details: `commitHash (${result.commitHash}) !== commitSha (${result.commitSha})` });
    }
    if (result.context === 'File' && result.filePath !== result.path) {
      violations.push({ index: i, input: String(input), rule: 'FieldRelationship', details: `filePath (${result.filePath}) !== path (${result.path}) in File context` });
    }

    // --- TASK 2 EQUIVALENCE CHECK ---
    // Check that isValidGithubUrl(url) is strictly equivalent to parseGithubUrl(url).valid
    if (isValid !== result.valid) {
      isValidEquivalenceFailures++;
      violations.push({ index: i, input: String(input), rule: 'Task2Equivalence', details: `isValidGithubUrl (${isValid}) !== result.valid (${result.valid})` });
    }

    // --- TASK 3 EQUIVALENCE CHECK ---
    // Check that extractRepoPath(url) is strictly equivalent to `${parsed.owner}/${parsed.repo}` when repo exists, or `null` otherwise.
    const expectedRepoPath = (result.owner && result.repo) ? `${result.owner}/${result.repo}` : null;
    if (repoPath !== expectedRepoPath) {
      extractRepoPathEquivalenceFailures++;
      violations.push({ index: i, input: String(input), rule: 'Task3Equivalence', details: `extractRepoPath (${repoPath}) !== expected (${expectedRepoPath})` });
    }

    // Helper check: normalizeGithubUrl vs result.normalizedUrl
    if (normalized !== result.normalizedUrl) {
      normalizeEquivalenceFailures++;
      violations.push({ index: i, input: String(input), rule: 'NormalizeEquivalence', details: `normalizeGithubUrl (${normalized}) !== result.normalizedUrl (${result.normalizedUrl})` });
    }
  }

  const endTotal = process.hrtime.bigint();
  const totalTimeNs = endTotal - startTotal;
  const totalTimeMs = Number(totalTimeNs) / 1e6;
  const parseTimeMs = Number(totalParseTimeNs) / 1e6;
  const avgParseUs = (parseTimeMs * 1000) / allUrls.length;
  const opsPerSec = Math.round((allUrls.length / parseTimeMs) * 1000);

  // Isolate 1,000 randomized URLs statistics separately for exact Task 1 reporting
  const randTimeNs = totalParseTimeNs; // total parse time across set

  return {
    totalUrlsTested: allUrls.length,
    randomizedUrlsCount: randomizedUrls.length,
    edgeCasesCount: edgeCases.length,
    validCount,
    invalidCount,
    contextCounts,
    totalTimeMs: Number(totalTimeMs.toFixed(3)),
    parseTimeMs: Number(parseTimeMs.toFixed(3)),
    avgParseUs: Number(avgParseUs.toFixed(3)),
    opsPerSec,
    violationsCount: violations.length,
    violations,
    isValidEquivalenceFailures,
    extractRepoPathEquivalenceFailures,
    normalizeEquivalenceFailures
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Empirical Harness across 1,050 total test URLs (1,000 randomized + 50 edge cases)...');
  const stats = runEmpiricalHarness();
  console.log('--- HARNESS RESULTS ---');
  console.log(JSON.stringify(stats, null, 2));
}
