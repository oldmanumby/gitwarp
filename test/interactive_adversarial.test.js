import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/parser.js';
import {
  isInteractiveCardCompatible,
  buildDeepLinkerUrl,
  buildTimeMachineUrl,
  buildCommitFeedUrl,
  renderInteractiveCards,
} from '../src/interactive.js';

describe('Adversarial & Edge Case Tests for src/interactive.js', () => {
  const baseFileCtx = Object.freeze(
    parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js')
  );
  const baseRepoCtx = Object.freeze(parseGithubUrl('https://github.com/facebook/react'));

  describe('1. Deep Linker Edge Cases (buildDeepLinkerUrl)', () => {
    it('handles huge line numbers without crashing', () => {
      const hugeNumStr = '9999999999999999999999';
      const url = buildDeepLinkerUrl(baseFileCtx, {
        lineStart: hugeNumStr,
        lineEnd: '10000000000000000000000',
      });
      assert.ok(url);
      assert.ok(url.startsWith('https://github.com/facebook/react/blob/main/src/index.js#L'));
    });

    it('handles Number.MAX_SAFE_INTEGER line numbers (noting IEEE-754 float precision limit)', () => {
      const maxInt = Number.MAX_SAFE_INTEGER;
      const urlMax = buildDeepLinkerUrl(baseFileCtx, { lineStart: maxInt });
      assert.ok(urlMax.includes('#L9007199254740991'));

      // Above MAX_SAFE_INTEGER, JS numbers lose odd-integer precision (e.g. 9007199254740991 + 100 -> 9007199254741092)
      const overflowInt = maxInt + 100;
      const urlOverflow = buildDeepLinkerUrl(baseFileCtx, { lineStart: overflowInt });
      assert.ok(urlOverflow.includes(`#L${overflowInt}`));
    });

    it('rejects negative line numbers (-100, -1)', () => {
      const url1 = buildDeepLinkerUrl(baseFileCtx, { lineStart: -100 });
      assert.equal(url1, 'https://github.com/facebook/react/blob/main/src/index.js');

      const url2 = buildDeepLinkerUrl(baseFileCtx, { lineStart: -1, lineEnd: -50 });
      assert.equal(url2, 'https://github.com/facebook/react/blob/main/src/index.js');
    });

    it('handles zero as an invalid line number (< 1 requirement)', () => {
      const url = buildDeepLinkerUrl(baseFileCtx, { lineStart: 0, lineEnd: 0 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js');
    });

    it('swaps reversed bounds (lineStart=100, lineEnd=1)', () => {
      const url = buildDeepLinkerUrl(baseFileCtx, { lineStart: 100, lineEnd: 1 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L1-L100');
    });

    it('truncates floating point line numbers (10.5 -> 10, 3.14159 -> 3)', () => {
      const url = buildDeepLinkerUrl(baseFileCtx, { lineStart: 10.5, lineEnd: 25.89 });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js#L10-L25');
    });

    it('evaluates plainToggle parameter values strictly vs truthy strings', () => {
      // String 'false' and '0' evaluate strictly to false (plainToggle disabled)
      const urlFalseStr = buildDeepLinkerUrl(baseFileCtx, { plainToggle: 'false' });
      assert.equal(urlFalseStr, 'https://github.com/facebook/react/blob/main/src/index.js');

      const urlZeroStr = buildDeepLinkerUrl(baseFileCtx, { plainToggle: '0' });
      assert.equal(urlZeroStr, 'https://github.com/facebook/react/blob/main/src/index.js');

      const urlBoolFalse = buildDeepLinkerUrl(baseFileCtx, { plainToggle: false });
      assert.equal(urlBoolFalse, 'https://github.com/facebook/react/blob/main/src/index.js');

      const urlBoolTrue = buildDeepLinkerUrl(baseFileCtx, { plainToggle: true });
      assert.equal(urlBoolTrue, 'https://github.com/facebook/react/blob/main/src/index.js?plain=1');

      const urlTrueStr = buildDeepLinkerUrl(baseFileCtx, { plainToggle: 'true' });
      assert.equal(urlTrueStr, 'https://github.com/facebook/react/blob/main/src/index.js?plain=1');

      const urlOneStr = buildDeepLinkerUrl(baseFileCtx, { plainToggle: '1' });
      assert.equal(urlOneStr, 'https://github.com/facebook/react/blob/main/src/index.js?plain=1');
    });

    it('handles non-numeric line values (NaN, objects, arrays, functions)', () => {
      const url = buildDeepLinkerUrl(baseFileCtx, { lineStart: 'invalid', lineEnd: {} });
      assert.equal(url, 'https://github.com/facebook/react/blob/main/src/index.js');
    });
  });

  describe('2. Time Machine Edge Cases (buildTimeMachineUrl)', () => {
    it('handles complex ref names containing slashes (feature/fix-1, refs/tags/v1.0.0)', () => {
      const url = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'feature/fix-1',
        compareMode: 'ref',
        compareRef: 'refs/tags/v1.0.0',
      });
      assert.equal(
        url,
        'https://github.com/facebook/react/compare/feature/fix-1...refs/tags/v1.0.0'
      );
    });

    it('inspects encoding of special characters in baseRef and compareRef', () => {
      const url = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'main',
        compareMode: 'ref',
        compareRef: 'v1.0.0-beta.1+build.123',
      });
      assert.equal(
        url,
        'https://github.com/facebook/react/compare/main...v1.0.0-beta.1%2Bbuild.123'
      );

      // Test with spaces, hashes, and question marks (safely URL-encoded per path segment)
      const urlSpecial = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'main',
        compareMode: 'ref',
        compareRef: 'feature #1?query=1',
      });
      assert.equal(
        urlSpecial,
        'https://github.com/facebook/react/compare/main...feature%20%231%3Fquery%3D1'
      );
    });

    it('handles empty and whitespace-only baseRef and compareRef', () => {
      const url1 = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: '   ',
        compareMode: 'ref',
        compareRef: '   ',
      });
      // Fallback: baseRef -> parsedContext.ref ('main'), compareRef -> 'HEAD'
      assert.equal(url1, 'https://github.com/facebook/react/compare/main...HEAD');

      const url2 = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: '',
        compareMode: 'ref',
        compareRef: '',
      });
      assert.equal(url2, 'https://github.com/facebook/react/compare/main...HEAD');
    });

    it('handles relative date syntax and custom dates', () => {
      const urlTimeframe = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'main',
        compareMode: 'timeframe',
        timeframe: '2.months.ago',
      });
      assert.equal(
        urlTimeframe,
        'https://github.com/facebook/react/compare/main@{2.months.ago}...main'
      );

      const urlCustomDate = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'dev',
        compareMode: 'custom_date',
        customDate: '2026-01-15',
      });
      assert.equal(
        urlCustomDate,
        'https://github.com/facebook/react/compare/dev@{2026-01-15}...dev'
      );
    });

    it('falls back to 1.week.ago when custom date is whitespace only', () => {
      const url = buildTimeMachineUrl(baseRepoCtx, {
        baseRef: 'main',
        compareMode: 'custom_date',
        customDate: '   ',
      });
      assert.equal(url, 'https://github.com/facebook/react/compare/main@{1.week.ago}...main');
    });
  });

  describe('3. Commit Feed Edge Cases (buildCommitFeedUrl)', () => {
    it('sanitizes malicious author names containing spaces, quotes, HTML, and query params', () => {
      const authorInput = '"John Doe" <john@example.com> & <script>alert(1)</script>';
      const url = buildCommitFeedUrl(baseRepoCtx, {
        refInput: 'main',
        authorInput,
      });
      assert.equal(
        url,
        'https://github.com/facebook/react/commits/main?author=%22John%20Doe%22%20%3Cjohn%40example.com%3E%20%26%20%3Cscript%3Ealert(1)%3C%2Fscript%3E'
      );
    });

    it('handles deep nested paths and multiple leading/consecutive slashes', () => {
      const url1 = buildCommitFeedUrl(baseRepoCtx, {
        refInput: 'main',
        pathInput: 'a/b/c/d.js',
      });
      assert.equal(url1, 'https://github.com/facebook/react/commits/main/a/b/c/d.js');

      const url2 = buildCommitFeedUrl(baseRepoCtx, {
        refInput: 'main',
        pathInput: '///a//b///c///d.js',
      });
      assert.equal(url2, 'https://github.com/facebook/react/commits/main/a//b///c///d.js');
    });

    it('handles empty branch/ref with and without path filter', () => {
      const urlWithPath = buildCommitFeedUrl(baseRepoCtx, {
        refInput: '   ',
        pathInput: 'src/index.js',
      });
      assert.equal(urlWithPath, 'https://github.com/facebook/react/commits/HEAD/src/index.js');

      const urlNoPath = buildCommitFeedUrl(baseRepoCtx, {
        refInput: '',
        pathInput: '',
      });
      assert.equal(urlNoPath, 'https://github.com/facebook/react/commits');
    });

    it('encodes special characters in pathInput', () => {
      const url = buildCommitFeedUrl(baseRepoCtx, {
        refInput: 'main',
        pathInput: 'src/my file #1.js',
      });
      assert.equal(url, 'https://github.com/facebook/react/commits/main/src/my%20file%20%231.js');
    });
  });

  describe('4. Context Property Mutation & Frozen Object Handling', () => {
    it('accepts frozen parsedContext without attempting to mutate properties or throwing', () => {
      const frozenFileCtx = Object.freeze({
        valid: true,
        context: 'File',
        owner: 'facebook',
        repo: 'react',
        ref: 'main',
        filePath: 'package.json',
        lineStart: 10,
        lineEnd: 20,
        queryParams: Object.freeze({ plain: '1' }),
        isRaw: false,
      });

      assert.doesNotThrow(() => {
        isInteractiveCardCompatible('deep_linker', frozenFileCtx);
        buildDeepLinkerUrl(frozenFileCtx, { lineStart: 15 });
        buildTimeMachineUrl(frozenFileCtx, { compareRef: 'dev' });
        buildCommitFeedUrl(frozenFileCtx, { authorInput: 'dan' });
      });
    });

    it('guarantees zero side-effects / mutations on input options or context objects', () => {
      const origCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js');
      const ctxCopy = JSON.stringify(origCtx);

      const opts = { lineStart: 10, lineEnd: 20 };
      const optsCopy = JSON.stringify(opts);

      buildDeepLinkerUrl(origCtx, opts);
      buildTimeMachineUrl(origCtx, opts);
      buildCommitFeedUrl(origCtx, opts);

      assert.equal(JSON.stringify(origCtx), ctxCopy);
      assert.equal(JSON.stringify(opts), optsCopy);
    });
  });

  describe('5. DOM Renderer Edge Cases (renderInteractiveCards)', () => {
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
          fns.forEach((fn) => fn({ currentTarget: mock }));
        },
        querySelector(selector) {
          return (
            children.find(
              (c) =>
                c.id === selector.replace('#', '') ||
                c.className?.includes(selector.replace('.', ''))
            ) || null
          );
        },
        querySelectorAll(selector) {
          return children.filter((c) => c.className?.includes(selector.replace('.', '')));
        },
        appendChild(child) {
          child.parentElement = mock;
          children.push(child);
          return child;
        },
      };

      return mock;
    }

    it('renders safely when window.lucide throws an exception during createIcons', () => {
      const mockContainer = createMockElement();

      // Temporarily mock throwing lucide
      const globalWindow = globalThis.window;
      globalThis.window = {
        lucide: {
          createIcons() {
            throw new Error('Lucide icon failure');
          },
        },
      };

      try {
        assert.doesNotThrow(() => {
          renderInteractiveCards(mockContainer, baseFileCtx);
        });
      } finally {
        globalThis.window = globalWindow;
      }
    });

    it('handles frozen context in DOM renderer gracefully', () => {
      const mockContainer = createMockElement();
      const frozenCtx = Object.freeze(
        parseGithubUrl('https://github.com/facebook/react/blob/main/src/index.js')
      );

      assert.doesNotThrow(() => {
        renderInteractiveCards(mockContainer, frozenCtx);
      });
    });
  });
});
