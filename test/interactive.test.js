import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/parser.js';
import {
  isInteractiveCardCompatible,
  buildDeepLinkerUrl,
  buildTimeMachineUrl,
  buildCommitFeedUrl,
  renderInteractiveCards,
  escapeHtml
} from '../src/interactive.js';

describe('Interactive Cards Component (src/interactive.js)', () => {

  describe('HTML Escaping Helper (escapeHtml)', () => {
    it('escapes special HTML characters properly', () => {
      assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      assert.equal(escapeHtml("foo & bar 'baz'"), 'foo &amp; bar &#39;baz&#39;');
      assert.equal(escapeHtml(''), '');
      assert.equal(escapeHtml(null), '');
      assert.equal(escapeHtml(undefined), '');
    });
  });

  describe('Context Compatibility (isInteractiveCardCompatible)', () => {
    const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/package.json');
    const repoCtx = parseGithubUrl('https://github.com/facebook/react');
    const userCtx = parseGithubUrl('https://github.com/torvalds');
    const commitCtx = parseGithubUrl('https://github.com/facebook/react/commit/a1b2c3d');
    const prCtx = parseGithubUrl('https://github.com/facebook/react/pull/42');
    const invalidCtx = parseGithubUrl('not-a-valid-url');

    it('deep_linker is compatible only with File context', () => {
      assert.equal(isInteractiveCardCompatible('deep_linker', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('deep_linker', repoCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', userCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', commitCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', prCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', invalidCtx), false);
    });

    it('time_machine is compatible with Repo and File context', () => {
      assert.equal(isInteractiveCardCompatible('time_machine', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('time_machine', repoCtx), true);
      assert.equal(isInteractiveCardCompatible('time_machine', userCtx), false);
      assert.equal(isInteractiveCardCompatible('time_machine', commitCtx), false);
      assert.equal(isInteractiveCardCompatible('time_machine', prCtx), false);
      assert.equal(isInteractiveCardCompatible('time_machine', invalidCtx), false);
    });

    it('commit_feed is compatible with Repo and File context', () => {
      assert.equal(isInteractiveCardCompatible('commit_feed', fileCtx), true);
      assert.equal(isInteractiveCardCompatible('commit_feed', repoCtx), true);
      assert.equal(isInteractiveCardCompatible('commit_feed', userCtx), false);
      assert.equal(isInteractiveCardCompatible('commit_feed', commitCtx), false);
      assert.equal(isInteractiveCardCompatible('commit_feed', prCtx), false);
      assert.equal(isInteractiveCardCompatible('commit_feed', invalidCtx), false);
    });

    it('accepts card object with id property', () => {
      assert.equal(isInteractiveCardCompatible({ id: 'deep_linker' }, fileCtx), true);
      assert.equal(isInteractiveCardCompatible({ id: 'deep_linker' }, repoCtx), false);
    });

    it('returns false for unknown card IDs and malformed contexts', () => {
      assert.equal(isInteractiveCardCompatible('unknown_card', fileCtx), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', null), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', undefined), false);
      assert.equal(isInteractiveCardCompatible('deep_linker', { valid: false }), false);
    });
  });

  describe('Deep Linker URL Generation (buildDeepLinkerUrl)', () => {
    const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js');
    const fileCtxWithLines = parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js#L10-L20');
    const repoCtx = parseGithubUrl('https://github.com/facebook/react');

    it('returns null for non-File or invalid contexts', () => {
      assert.equal(buildDeepLinkerUrl(repoCtx), null);
      assert.equal(buildDeepLinkerUrl(null), null);
      assert.equal(buildDeepLinkerUrl({ valid: true, context: 'File' }), null);
    });

    it('generates basic line link #L10', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10');
    });

    it('generates range line link #L10-L20', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10, lineEnd: 20 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L20');
    });

    it('swaps inverted line range (start=50, end=10 -> #L10-L50)', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 50, lineEnd: 10 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L50');
    });

    it('collapses equal line range (start=15, end=15 -> #L15)', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 15, lineEnd: 15 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L15');
    });

    it('ignores negative numbers and non-numeric line inputs', () => {
      const url1 = buildDeepLinkerUrl(fileCtx, { lineStart: -5, lineEnd: 'abc' });
      assert.equal(url1, 'https://github.com/facebook/react/blob/main/src/index.js');

      const url2 = buildDeepLinkerUrl(fileCtx, { lineStart: '10', lineEnd: '25' });
      assert.equal(url2, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L25');
    });

    it('handles plainToggle parameter correctly', () => {
      const url = buildDeepLinkerUrl(fileCtx, { lineStart: 10, plainToggle: true });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js?plain=1#L10');
    });

    it('prefills from parsedContext hash fragments if options are empty', () => {
      const url = buildDeepLinkerUrl(fileCtxWithLines);
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L20');
    });

    it('allows options to override prefilled line numbers', () => {
      const url = buildDeepLinkerUrl(fileCtxWithLines, { lineStart: 30, lineEnd: 40 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L30-L40');
    });

    it('clears line range when options pass empty string', () => {
      const url = buildDeepLinkerUrl(fileCtxWithLines, { lineStart: '', lineEnd: '' });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js');
    });
  });

  describe('Time Machine Compare URL Generation (buildTimeMachineUrl)', () => {
    const repoCtx = parseGithubUrl('https://github.com/octocat/Hello-World');
    const fileCtx = parseGithubUrl('https://github.com/octocat/Hello-World/blob/main/README.md');
    const userCtx = parseGithubUrl('https://github.com/torvalds');

    it('returns null for incompatible or invalid contexts', () => {
      assert.equal(buildTimeMachineUrl(userCtx), null);
      assert.equal(buildTimeMachineUrl(null), null);
      assert.equal(buildTimeMachineUrl({ valid: false }), null);
    });

    it('generates ref compare URL (main...dev)', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'ref', compareRef: 'dev' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...dev');
    });

    it('defaults compareRef to HEAD if omitted in ref mode', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'ref', compareRef: '' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...HEAD');
    });

    it('generates relative timeframe compare URL (main@{1.week.ago}...main)', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'timeframe', timeframe: '1.week.ago' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main@{1.week.ago}...main');
    });

    it('handles all timeframe dropdown options (1.month.ago, yesterday, 1.year.ago)', () => {
      const t1 = buildTimeMachineUrl(repoCtx, { compareMode: 'timeframe', timeframe: '1.month.ago' });
      assert.equal(t1, 'https://github.com/octocat/Hello-World/compare/main@{1.month.ago}...main');

      const t2 = buildTimeMachineUrl(repoCtx, { compareMode: 'timeframe', timeframe: 'yesterday' });
      assert.equal(t2, 'https://github.com/octocat/Hello-World/compare/main@{yesterday}...main');

      const t3 = buildTimeMachineUrl(repoCtx, { compareMode: 'timeframe', timeframe: '1.year.ago' });
      assert.equal(t3, 'https://github.com/octocat/Hello-World/compare/main@{1.year.ago}...main');
    });

    it('generates custom date compare URL (main@{2025-06-01}...main)', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'custom_date', customDate: '2025-06-01' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main@{2025-06-01}...main');
    });

    it('falls back to 1.week.ago if custom date string is empty', () => {
      const url = buildTimeMachineUrl(repoCtx, { baseRef: 'main', compareMode: 'custom_date', customDate: '' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main@{1.week.ago}...main');
    });

    it('appends path parameter when context is File and includeFilePath is true', () => {
      const url = buildTimeMachineUrl(fileCtx, { baseRef: 'main', compareMode: 'ref', compareRef: 'dev', includeFilePath: true });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...dev?path=README.md');
    });

    it('omits path parameter when includeFilePath is false', () => {
      const url = buildTimeMachineUrl(fileCtx, { baseRef: 'main', compareMode: 'ref', compareRef: 'dev', includeFilePath: false });
      assert.equal(url, 'https://github.com/octocat/Hello-World/compare/main...dev');
    });
  });

  describe('Commit Feed URL Generation (buildCommitFeedUrl)', () => {
    const repoCtx = parseGithubUrl('https://github.com/octocat/Hello-World');
    const fileCtx = parseGithubUrl('https://github.com/octocat/Hello-World/blob/main/src/index.js');
    const userCtx = parseGithubUrl('https://github.com/torvalds');

    it('returns null for incompatible or invalid contexts', () => {
      assert.equal(buildCommitFeedUrl(userCtx), null);
      assert.equal(buildCommitFeedUrl(null), null);
      assert.equal(buildCommitFeedUrl({ valid: false }), null);
    });

    it('generates branch commits URL', () => {
      const url = buildCommitFeedUrl(repoCtx, { refInput: 'main' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main');
    });

    it('generates branch + author filter URL', () => {
      const url = buildCommitFeedUrl(repoCtx, { refInput: 'main', authorInput: 'octocat' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main?author=octocat');
    });

    it('generates branch + path filter URL for File context', () => {
      const url = buildCommitFeedUrl(fileCtx, { refInput: 'main', pathInput: 'src/index.js' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/main/src/index.js');
    });

    it('generates path filter URL with default HEAD ref when ref is empty', () => {
      const url = buildCommitFeedUrl(repoCtx, { refInput: '', pathInput: 'src/index.js' });
      assert.equal(url, 'https://github.com/octocat/Hello-World/commits/HEAD/src/index.js');
    });

    it('handles special characters in author and path filters gracefully', () => {
      const url = buildCommitFeedUrl(repoCtx, {
        refInput: 'feature/v1',
        pathInput: 'src/my file.js',
        authorInput: 'John Doe <john@example.com>'
      });
      assert.equal(
        url,
        'https://github.com/octocat/Hello-World/commits/feature%2Fv1/src/my%20file.js?author=John%20Doe%20%3Cjohn%40example.com%3E'
      );
    });
  });

  describe('DOM Renderer (renderInteractiveCards)', () => {

    function createMockElement() {
      const eventListeners = {};
      const attributes = {};
      const children = [];

      const mock = {
        innerHTML: '',
        style: {},
        value: '',
        checked: false,
        href: '',
        textContent: '',
        title: '',
        parentElement: null,

        setAttribute(key, val) {
          attributes[key] = String(val);
        },
        getAttribute(key) {
          return attributes[key] || null;
        },
        removeAttribute(key) {
          delete attributes[key];
        },
        addEventListener(event, fn) {
          if (!eventListeners[event]) eventListeners[event] = [];
          eventListeners[event].push(fn);
        },
        dispatchEvent(event) {
          const fns = eventListeners[event] || [];
          fns.forEach(fn => fn({ currentTarget: mock }));
        },
        querySelector(selector) {
          // Simple selector lookup helper for mock testing
          return children.find(c => c.id === selector.replace('#', '') || c.className?.includes(selector.replace('.', ''))) || null;
        },
        querySelectorAll(selector) {
          return children.filter(c => c.className?.includes(selector.replace('.', '')));
        },
        appendChild(child) {
          child.parentElement = mock;
          children.push(child);
          return child;
        }
      };

      return mock;
    }

    it('handles null and invalid container arguments gracefully', () => {
      assert.doesNotThrow(() => {
        renderInteractiveCards(null, null);
        renderInteractiveCards(undefined, undefined);
        renderInteractiveCards({}, null);
      });
    });

    it('renders fallback notice into container for invalid context', () => {
      const mockContainer = createMockElement();
      const invalidCtx = parseGithubUrl('invalid-url');
      renderInteractiveCards(mockContainer, invalidCtx);

      assert.ok(mockContainer.innerHTML.includes('Interactive Tools'));
      assert.ok(mockContainer.innerHTML.includes('Enter a valid GitHub URL'));
    });

    it('renders all three interactive cards for valid File context', () => {
      const mockContainer = createMockElement();
      const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/package.json');
      renderInteractiveCards(mockContainer, fileCtx);

      assert.ok(mockContainer.innerHTML.includes('data-card-id="deep_linker"'));
      assert.ok(mockContainer.innerHTML.includes('data-card-id="time_machine"'));
      assert.ok(mockContainer.innerHTML.includes('data-card-id="commit_feed"'));
      assert.ok(mockContainer.innerHTML.includes('Deep Linker'));
      assert.ok(mockContainer.innerHTML.includes('Time Machine Compare'));
      assert.ok(mockContainer.innerHTML.includes('Commit Feed'));
    });

    it('marks deep_linker as disabled with context mismatch for Repo context', () => {
      const mockContainer = createMockElement();
      const repoCtx = parseGithubUrl('https://github.com/facebook/react');
      renderInteractiveCards(mockContainer, repoCtx);

      assert.ok(mockContainer.innerHTML.includes('Deep Linker requires a <strong>File</strong> context URL'));
      assert.ok(mockContainer.innerHTML.includes('Context Mismatch'));
    });

  });

});
