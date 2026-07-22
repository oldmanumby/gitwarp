/**
 * Project: GitWarp
 * Description: Engine for parsing GitHub URLs and determining context.
 * 
 * Author: B.A. Umberger (Old Man Umby)
 * Website: https://oldmanumby.com
 * GitHub: https://github.com/oldmanumby
 * 
 * Copyright (c) 2026 B.A. Umberger.
 * Released under the MIT License.
 */
/**
 * GitHub URL Context Parser
 * Pure Vanilla JS parser for GitHub URLs across User, Repo, File, Commit, and PR contexts.
 */

/**
 * Reserved GitHub top-level path segments that represent system routes, not usernames.
 */
const RESERVED_NAMES = new Set([
  'about',
  'apps',
  'blog',
  'careers',
  'contact',
  'customer-stories',
  'enterprise',
  'explore',
  'features',
  'join',
  'login',
  'marketplace',
  'notifications',
  'orgs',
  'press',
  'pricing',
  'search',
  'security',
  'settings',
  'signup',
  'site',
  'sponsors',
  'stars',
  'topics',
  'trending',
]);

/**
 * Extracts lineStart and lineEnd from URL hash fragments (e.g. #L10-L20 or #L15).
 *
 * @param {string} hash
 * @returns {{ lineStart: number|null, lineEnd: number|null }}
 */
function parseLineFragment(hash) {
  if (!hash || typeof hash !== 'string') {
    return { lineStart: null, lineEnd: null };
  }

  // Line range: #L10-L20 or #L10C1-L20C5
  const rangeMatch = hash.match(/^#L(\d+)(?:C\d+)?-L(\d+)(?:C\d+)?$/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    return {
      lineStart: Number.isFinite(start) ? start : null,
      lineEnd: Number.isFinite(end) ? end : null,
    };
  }

  // Single line: #L10 or #L10C5
  const singleMatch = hash.match(/^#L(\d+)(?:C\d+)?$/i);
  if (singleMatch) {
    const line = parseInt(singleMatch[1], 10);
    const validLine = Number.isFinite(line) ? line : null;
    return {
      lineStart: validLine,
      lineEnd: validLine,
    };
  }

  return { lineStart: null, lineEnd: null };
}

/**
 * Parses any GitHub URL into an immutable context object.
 *
 * @param {string} inputUrl
 * @returns {Readonly<{
 *   valid: boolean,
 *   context: 'User'|'Repo'|'File'|'Commit'|'PR'|'Unknown',
 *   type: string,
 *   owner: string|null,
 *   repo: string|null,
 *   ref: string|null,
 *   filePath: string|null,
 *   path: string|null,
 *   commitHash: string|null,
 *   commitSha: string|null,
 *   prNumber: string|null,
 *   lineStart: number|null,
 *   lineEnd: number|null,
 *   isRaw: boolean,
 *   queryParams: Record<string, string>,
 *   rawUrl: string,
 *   normalizedUrl: string|null
 * }>}
 */
export function parseGithubUrl(inputUrl) {
  if (typeof inputUrl !== 'string') {
    return Object.freeze({
      valid: false,
      context: 'Unknown',
      type: 'unknown',
      owner: null,
      repo: null,
      ref: null,
      filePath: null,
      path: null,
      commitHash: null,
      commitSha: null,
      prNumber: null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze({}),
      rawUrl: '',
      normalizedUrl: null,
    });
  }

  const rawUrl = inputUrl;

  const createUnknownResult = () =>
    Object.freeze({
      valid: false,
      context: 'Unknown',
      type: 'unknown',
      owner: null,
      repo: null,
      ref: null,
      filePath: null,
      path: null,
      commitHash: null,
      commitSha: null,
      prNumber: null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze({}),
      rawUrl,
      normalizedUrl: null,
    });

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return createUnknownResult();
  }

  // Prepend protocol if missing
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = 'https://' + urlString;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return createUnknownResult();
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const validHostnames = [
    'github.com',
    'www.github.com',
    'raw.githubusercontent.com',
    'github.dev',
    'github1s.com',
  ];

  if (!validHostnames.includes(hostname)) {
    return createUnknownResult();
  }

  // Parse Query Parameters
  const queryParams = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    queryParams[key] = value;
  }

  // Parse Hash Fragments
  const { lineStart, lineEnd } = parseLineFragment(parsedUrl.hash);

  // Handle raw.githubusercontent.com domain
  if (hostname === 'raw.githubusercontent.com') {
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    if (segments.length >= 3) {
      const owner = segments[0];
      const repo = segments[1].replace(/\.git$/i, '');
      const ref = segments[2];
      const filePath = segments.slice(3).join('/') || null;
      const normalizedUrl = `https://github.com/${owner}/${repo}/blob/${ref}${filePath ? '/' + filePath : ''}`;

      return Object.freeze({
        valid: true,
        context: 'File',
        type: 'file',
        owner,
        repo,
        ref,
        filePath,
        path: filePath,
        commitHash: null,
        commitSha: null,
        prNumber: null,
        lineStart,
        lineEnd,
        isRaw: true,
        queryParams: Object.freeze(queryParams),
        rawUrl,
        normalizedUrl,
      });
    } else {
      return createUnknownResult();
    }
  }

  // For github.com, www.github.com, github.dev, github1s.com
  const segments = parsedUrl.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    // Homepage
    return createUnknownResult();
  }

  // Segment 1: User Context or Reserved Route
  if (segments.length === 1) {
    const firstSegment = segments[0];
    if (RESERVED_NAMES.has(firstSegment.toLowerCase())) {
      return createUnknownResult();
    }
    const owner = firstSegment;
    const normalizedUrl = `https://github.com/${owner}`;

    return Object.freeze({
      valid: true,
      context: 'User',
      type: 'user',
      owner,
      repo: null,
      ref: null,
      filePath: null,
      path: null,
      commitHash: null,
      commitSha: null,
      prNumber: null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze(queryParams),
      rawUrl,
      normalizedUrl,
    });
  }

  // Segments >= 2
  const owner = segments[0];
  if (RESERVED_NAMES.has(owner.toLowerCase())) {
    return createUnknownResult();
  }

  const repoRaw = segments[1];
  const repo = repoRaw.replace(/\.git$/i, '');

  if (segments.length === 2) {
    // Repo root: github.com/owner/repo
    const normalizedUrl = `https://github.com/${owner}/${repo}`;
    return Object.freeze({
      valid: true,
      context: 'Repo',
      type: 'repo',
      owner,
      repo,
      ref: null,
      filePath: null,
      path: null,
      commitHash: null,
      commitSha: null,
      prNumber: null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze(queryParams),
      rawUrl,
      normalizedUrl,
    });
  }

  // Segments >= 3: sub-resource routing
  const route = segments[2].toLowerCase();

  if (route === 'tree') {
    const ref = segments[3] || null;
    const subpath = segments.slice(4).join('/') || null;

    if (!subpath) {
      // Branch / Tag root (github.com/owner/repo/tree/main)
      const normalizedUrl = `https://github.com/${owner}/${repo}/tree/${ref}`;
      return Object.freeze({
        valid: true,
        context: 'Repo',
        type: 'repo',
        owner,
        repo,
        ref,
        filePath: null,
        path: null,
        commitHash: null,
        commitSha: null,
        prNumber: null,
        lineStart,
        lineEnd,
        isRaw: false,
        queryParams: Object.freeze(queryParams),
        rawUrl,
        normalizedUrl,
      });
    } else {
      // Directory tree view (github.com/owner/repo/tree/main/src/components) -> context: 'File'
      const normalizedUrl = `https://github.com/${owner}/${repo}/tree/${ref}/${subpath}`;
      return Object.freeze({
        valid: true,
        context: 'File',
        type: 'file',
        owner,
        repo,
        ref,
        filePath: subpath,
        path: subpath,
        commitHash: null,
        commitSha: null,
        prNumber: null,
        lineStart,
        lineEnd,
        isRaw: false,
        queryParams: Object.freeze(queryParams),
        rawUrl,
        normalizedUrl,
      });
    }
  }

  if (route === 'blob' || route === 'raw') {
    const ref = segments[3] || null;
    const filePath = segments.slice(4).join('/') || null;
    const normalizedUrl = `https://github.com/${owner}/${repo}/blob/${ref}${filePath ? '/' + filePath : ''}`;

    return Object.freeze({
      valid: true,
      context: 'File',
      type: 'file',
      owner,
      repo,
      ref,
      filePath,
      path: filePath,
      commitHash: null,
      commitSha: null,
      prNumber: null,
      lineStart,
      lineEnd,
      isRaw: route === 'raw',
      queryParams: Object.freeze(queryParams),
      rawUrl,
      normalizedUrl,
    });
  }

  if (route === 'commit') {
    const commitSha = segments[3] || null;
    const normalizedUrl = commitSha
      ? `https://github.com/${owner}/${repo}/commit/${commitSha}`
      : `https://github.com/${owner}/${repo}`;

    return Object.freeze({
      valid: true,
      context: 'Commit',
      type: 'commit',
      owner,
      repo,
      ref: commitSha,
      filePath: null,
      path: null,
      commitHash: commitSha,
      commitSha,
      prNumber: null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze(queryParams),
      rawUrl,
      normalizedUrl,
    });
  }

  if (route === 'pull' || route === 'pulls') {
    const prNumber = segments[3] || null;
    const normalizedUrl = prNumber
      ? `https://github.com/${owner}/${repo}/pull/${prNumber}`
      : `https://github.com/${owner}/${repo}`;

    return Object.freeze({
      valid: true,
      context: 'PR',
      type: 'pr',
      owner,
      repo,
      ref: null,
      filePath: null,
      path: null,
      commitHash: null,
      commitSha: null,
      prNumber: prNumber ? String(prNumber) : null,
      lineStart: null,
      lineEnd: null,
      isRaw: false,
      queryParams: Object.freeze(queryParams),
      rawUrl,
      normalizedUrl,
    });
  }

  // Unknown or generic repo route fallback
  return Object.freeze({
    valid: true,
    context: 'Repo',
    type: 'repo',
    owner,
    repo,
    ref: null,
    filePath: null,
    path: segments.slice(2).join('/') || null,
    commitHash: null,
    commitSha: null,
    prNumber: null,
    lineStart: null,
    lineEnd: null,
    isRaw: false,
    queryParams: Object.freeze(queryParams),
    rawUrl,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  });
}

/**
 * Returns true if inputUrl is a valid GitHub URL with a recognized context.
 *
 * @param {string} inputUrl
 * @returns {boolean}
 */
export function isValidGithubUrl(inputUrl) {
  return parseGithubUrl(inputUrl).valid;
}

/**
 * Extracts 'owner/repo' string if inputUrl is in Repo, File, Commit, or PR context.
 *
 * @param {string} inputUrl
 * @returns {string|null}
 */
export function extractRepoPath(inputUrl) {
  const result = parseGithubUrl(inputUrl);
  if (result.owner && result.repo) {
    return `${result.owner}/${result.repo}`;
  }
  return null;
}

/**
 * Normalizes inputUrl into standard canonical HTTPS URL.
 *
 * @param {string} inputUrl
 * @returns {string|null}
 */
export function normalizeGithubUrl(inputUrl) {
  return parseGithubUrl(inputUrl).normalizedUrl;
}
