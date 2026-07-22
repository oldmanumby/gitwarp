import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/parser.js';
import {
  isInteractiveCardCompatible,
  buildDeepLinkerUrl,
  buildTimeMachineUrl,
  buildCommitFeedUrl,
  renderInteractiveCards
} from '../src/interactive.js';

// Utility helper for pseudorandom deterministic generation (PRNG) for property testing
function createRandom(seed = 12345) {
  let state = seed;
  return function rand() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

describe('Interactive Cards Property & DOM Invariant Tests', () => {

  describe('Property Invariant 1: buildDeepLinkerUrl', () => {
    const DEEP_LINKER_REGEX = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/.+/;

    it('always produces a valid GitHub blob URL matching pattern for valid File context (1000 iterations)', () => {
      const rand = createRandom(42);
      const owners = ['octocat', 'facebook', 'torvalds', 'microsoft', 'a-b_c'];
      const repos = ['react', 'linux', 'vscode', 'gitswap', 'test.repo'];
      const refs = ['main', 'master', 'v1.0.0', 'feature/branch', 'a1b2c3d'];
      const filePaths = ['index.js', 'src/app/main.py', 'docs/README.md', 'a/b/c/d/file.txt', 'package.json'];

      for (let i = 0; i < 1000; i++) {
        const owner = owners[Math.floor(rand() * owners.length)];
        const repo = repos[Math.floor(rand() * repos.length)];
        const ref = refs[Math.floor(rand() * refs.length)];
        const filePath = filePaths[Math.floor(rand() * filePaths.length)];

        const fileContext = {
          valid: true,
          context: 'File',
          owner,
          repo,
          ref,
          filePath,
          lineStart: rand() > 0.5 ? Math.floor(rand() * 100) + 1 : null,
          lineEnd: rand() > 0.5 ? Math.floor(rand() * 100) + 1 : null,
          queryParams: { plain: rand() > 0.5 ? '1' : null }
        };

        const lineStartOpt = rand() < 0.3 ? null : (rand() < 0.6 ? undefined : (rand() < 0.8 ? Math.floor(rand() * 200) - 50 : String(Math.floor(rand() * 100))));
        const lineEndOpt = rand() < 0.3 ? null : (rand() < 0.6 ? undefined : (rand() < 0.8 ? Math.floor(rand() * 200) - 50 : String(Math.floor(rand() * 100))));
        const plainOpt = rand() < 0.5 ? true : (rand() < 0.8 ? false : undefined);

        const options = {
          lineStart: lineStartOpt,
          lineEnd: lineEndOpt,
          plainToggle: plainOpt
        };

        const result = buildDeepLinkerUrl(fileContext, options);

        // Invariant 1: Result must be a non-null string
        assert.equal(typeof result, 'string', `Expected string on iteration ${i}`);

        // Invariant 2: Result must match pattern ^https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/.+
        assert.ok(DEEP_LINKER_REGEX.test(result), `URL "${result}" failed pattern match on iteration ${i}`);

        // Invariant 3: Query parameters (?plain=1) must precede hash fragment (#L...)
        if (result.includes('?plain=1') && result.includes('#L')) {
          assert.ok(
            result.indexOf('?plain=1') < result.indexOf('#L'),
            `Query string must precede hash fragment in "${result}"`
          );
        }
      }
    });

    it('returns null for non-File or invalid contexts under all randomized options', () => {
      const rand = createRandom(99);
      const invalidContexts = [
        null,
        undefined,
        {},
        { valid: false },
        { valid: true, context: 'Repo', owner: 'foo', repo: 'bar' },
        { valid: true, context: 'User', owner: 'foo' },
        { valid: true, context: 'File', owner: '', repo: 'bar', filePath: 'a.js' },
        { valid: true, context: 'File', owner: 'foo', repo: '', filePath: 'a.js' },
        { valid: true, context: 'File', owner: 'foo', repo: 'bar', filePath: '' }
      ];

      for (const ctx of invalidContexts) {
        for (let i = 0; i < 20; i++) {
          const options = {
            lineStart: Math.floor(rand() * 100),
            lineEnd: Math.floor(rand() * 100),
            plainToggle: rand() > 0.5
          };
          assert.equal(buildDeepLinkerUrl(ctx, options), null);
        }
      }
    });

    it('correctly swaps inverted line ranges and formats single line fragments', () => {
      const ctx = { valid: true, context: 'File', owner: 'o', repo: 'r', ref: 'main', filePath: 'f.js' };

      // Inverted line range (start > end)
      const swapped = buildDeepLinkerUrl(ctx, { lineStart: 100, lineEnd: 20 });
      assert.ok(swapped.endsWith('#L20-L100'));

      // Equal line range (start === end)
      const collapsed = buildDeepLinkerUrl(ctx, { lineStart: 50, lineEnd: 50 });
      assert.ok(collapsed.endsWith('#L50'));

      // Single start line only
      const startOnly = buildDeepLinkerUrl(ctx, { lineStart: 30, lineEnd: null });
      assert.ok(startOnly.endsWith('#L30'));

      // Single end line only
      const endOnly = buildDeepLinkerUrl(ctx, { lineStart: null, lineEnd: 40 });
      assert.ok(endOnly.endsWith('#L40'));
    });
  });

  describe('Property Invariant 2: buildTimeMachineUrl & buildCommitFeedUrl', () => {
    const TIME_MACHINE_REGEX = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/.+/;
    const COMMIT_FEED_REGEX = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/commits(\/.*)?(\?author=.*)?/;

    it('buildTimeMachineUrl produces valid URLs for all Repo and File contexts (1000 iterations)', () => {
      const rand = createRandom(101);
      const contexts = ['Repo', 'File'];
      const modes = ['ref', 'timeframe', 'custom_date', 'unknown_mode', null, undefined];
      const timeframes = ['1.week.ago', '1.month.ago', 'yesterday', '1.year.ago', '2.days.ago'];
      const dates = ['2026-01-01', '2025-12-31', '', null, undefined];

      for (let i = 0; i < 1000; i++) {
        const contextType = contexts[Math.floor(rand() * contexts.length)];
        const ctx = {
          valid: true,
          context: contextType,
          owner: `user_${Math.floor(rand() * 100)}`,
          repo: `repo_${Math.floor(rand() * 100)}`,
          ref: rand() > 0.3 ? `branch_${Math.floor(rand() * 10)}` : null,
          filePath: contextType === 'File' ? `src/file_${Math.floor(rand() * 10)}.js` : null
        };

        const options = {
          baseRef: rand() > 0.5 ? `base_${Math.floor(rand() * 10)}` : undefined,
          compareMode: modes[Math.floor(rand() * modes.length)],
          compareRef: rand() > 0.5 ? `cmp_${Math.floor(rand() * 10)}` : undefined,
          timeframe: timeframes[Math.floor(rand() * timeframes.length)],
          customDate: dates[Math.floor(rand() * dates.length)],
          includeFilePath: rand() > 0.5
        };

        const result = buildTimeMachineUrl(ctx, options);

        assert.equal(typeof result, 'string', `Time machine result must be string on iteration ${i}`);
        assert.ok(TIME_MACHINE_REGEX.test(result), `Time machine URL "${result}" failed regex on iteration ${i}`);

        // Verify baseRef fallback
        const expectedBase = options.baseRef || ctx.ref || 'main';
        assert.ok(result.includes(`/compare/${expectedBase}`), `URL "${result}" missing expected baseRef "${expectedBase}"`);
      }
    });

    it('buildCommitFeedUrl produces valid URLs for all Repo and File contexts (1000 iterations)', () => {
      const rand = createRandom(202);
      const contexts = ['Repo', 'File'];
      const refs = ['main', 'dev', 'feature/test', '', null, undefined];
      const paths = ['src/index.js', '/leading/slash.txt', 'folder/file.css', '', null, undefined];
      const authors = ['octocat', 'john doe', 'alice@example.com', '', null, undefined];

      for (let i = 0; i < 1000; i++) {
        const contextType = contexts[Math.floor(rand() * contexts.length)];
        const ctx = {
          valid: true,
          context: contextType,
          owner: `owner_${Math.floor(rand() * 100)}`,
          repo: `repo_${Math.floor(rand() * 100)}`,
          ref: ctxTypeRef(rand(), refs),
          filePath: contextType === 'File' ? `file_${Math.floor(rand() * 10)}.js` : null,
          queryParams: { author: rand() > 0.7 ? 'ctx_author' : null }
        };

        const options = {
          refInput: refs[Math.floor(rand() * refs.length)],
          pathInput: paths[Math.floor(rand() * paths.length)],
          authorInput: authors[Math.floor(rand() * authors.length)]
        };

        const result = buildCommitFeedUrl(ctx, options);

        assert.equal(typeof result, 'string', `Commit feed result must be string on iteration ${i}`);
        assert.ok(COMMIT_FEED_REGEX.test(result), `Commit feed URL "${result}" failed regex on iteration ${i}`);

        // If pathInput has leading slash, check cleanPath stripped leading slashes
        if (options.pathInput && typeof options.pathInput === 'string' && options.pathInput.startsWith('/')) {
          assert.ok(!result.includes('/commits//'), `Commit feed URL "${result}" contained double slash from unstripped path`);
        }
      }

      function ctxTypeRef(r, refList) {
        return r > 0.5 ? refList[Math.floor(r * refList.length)] : null;
      }
    });

    it('returns null for non-Repo/File contexts for time machine and commit feed', () => {
      const invalidContexts = [
        null,
        undefined,
        { valid: false },
        { valid: true, context: 'User', owner: 'torvalds' },
        { valid: true, context: 'Commit', owner: 'o', repo: 'r', commitSha: '123' },
        { valid: true, context: 'PR', owner: 'o', repo: 'r', prNumber: '1' }
      ];

      for (const ctx of invalidContexts) {
        assert.equal(buildTimeMachineUrl(ctx), null);
        assert.equal(buildCommitFeedUrl(ctx), null);
      }
    });
  });

  describe('DOM Invariants & Interactive Component Lifecycle (renderInteractiveCards)', () => {

    function createFullMockDOM() {
      const elementsById = {};
      const allElements = [];

      function createMockNode(tagName, id = '', className = '') {
        const eventListeners = {};
        const attributes = {};

        const mockNode = {
          tagName: tagName.toUpperCase(),
          id,
          className,
          innerHTML: '',
          textContent: '',
          value: '',
          checked: false,
          href: '',
          title: '',
          style: { display: '' },
          parentElement: null,
          children: [],

          setAttribute(k, v) {
            attributes[k] = String(v);
          },
          getAttribute(k) {
            return attributes[k] !== undefined ? attributes[k] : null;
          },
          removeAttribute(k) {
            delete attributes[k];
          },
          hasAttribute(k) {
            return attributes[k] !== undefined;
          },
          addEventListener(evt, fn) {
            if (!eventListeners[evt]) eventListeners[evt] = [];
            eventListeners[evt].push(fn);
          },
          dispatchEvent(evt) {
            const list = eventListeners[evt] || [];
            list.forEach(fn => fn({ currentTarget: mockNode }));
          },
          querySelector(sel) {
            if (sel.startsWith('#')) {
              const targetId = sel.slice(1);
              return elementsById[targetId] || findChild(mockNode, node => node.id === targetId);
            }
            if (sel.startsWith('.')) {
              const targetClass = sel.slice(1);
              return findChild(mockNode, node => node.className && node.className.includes(targetClass));
            }
            if (sel.startsWith('[')) {
              const attrMatch = sel.match(/^\[([a-z0-9-]+)(?:="([^"]+)")?\]$/i);
              if (attrMatch) {
                const attrName = attrMatch[1];
                const attrVal = attrMatch[2];
                return findChild(mockNode, node => {
                  const val = node.getAttribute(attrName);
                  return attrVal !== undefined ? val === attrVal : val !== null;
                });
              }
            }
            return findChild(mockNode, node => node.tagName.toLowerCase() === sel.toLowerCase());
          },
          querySelectorAll(sel) {
            const results = [];
            findAllChildren(mockNode, node => {
              if (sel.startsWith('.')) {
                return node.className && node.className.includes(sel.slice(1));
              }
              if (sel.startsWith('#')) {
                return node.id === sel.slice(1);
              }
              if (sel.startsWith('[')) {
                const attrMatch = sel.match(/^\[([a-z0-9-]+)(?:="([^"]+)")?\]$/i);
                if (attrMatch) {
                  const attrName = attrMatch[1];
                  const attrVal = attrMatch[2];
                  const val = node.getAttribute(attrName);
                  return attrVal !== undefined ? val === attrVal : val !== null;
                }
              }
              return node.tagName.toLowerCase() === sel.toLowerCase();
            }, results);
            return results;
          }
        };

        if (id) elementsById[id] = mockNode;
        allElements.push(mockNode);
        return mockNode;
      }

      function findChild(parent, predicate) {
        for (const child of parent.children) {
          if (predicate(child)) return child;
          const found = findChild(child, predicate);
          if (found) return found;
        }
        return null;
      }

      function findAllChildren(parent, predicate, results) {
        for (const child of parent.children) {
          if (predicate(child)) results.push(child);
          findAllChildren(child, predicate, results);
        }
      }

      // Container node with innerHTML setter that builds child mock node tree
      const containerNode = createMockNode('div', 'container', 'interactive-container');

      Object.defineProperty(containerNode, 'innerHTML', {
        get() {
          return this._innerHTML || '';
        },
        set(htmlString) {
          this._innerHTML = htmlString;
          this.children = [];
          parseAndBuildTree(htmlString, this);
        }
      });

      function parseAndBuildTree(html, parent) {
        // HTML parser helper for mock node tree construction
        const tagRegex = /<([a-z1-6]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-z1-6]+)([^>]*)\/?>/gi;
        let match;
        while ((match = tagRegex.exec(html)) !== null) {
          const tagName = match[1] || match[4];
          const attrString = match[2] || match[5] || '';
          const inner = match[3] || '';

          const idMatch = attrString.match(/id="([^"]+)"/i);
          const classMatch = attrString.match(/class="([^"]+)"/i);
          const valueMatch = attrString.match(/value="([^"]*)"/i);
          const hrefMatch = attrString.match(/href="([^"]*)"/i);
          const dataUrlMatch = attrString.match(/data-url="([^"]*)"/i);
          const cardIdMatch = attrString.match(/data-card-id="([^"]+)"/i);
          const checked = /\bchecked\b/i.test(attrString);
          const disabled = /\bdisabled\b/i.test(attrString);

          const node = createMockNode(
            tagName,
            idMatch ? idMatch[1] : '',
            classMatch ? classMatch[1] : ''
          );

          if (valueMatch) node.value = valueMatch[1];
          if (hrefMatch) node.href = hrefMatch[1];
          if (dataUrlMatch) node.setAttribute('data-url', dataUrlMatch[1]);
          if (cardIdMatch) node.setAttribute('data-card-id', cardIdMatch[1]);
          node.checked = checked;
          if (disabled) node.setAttribute('disabled', 'true');

          // Extract text content if simple text
          if (inner && !inner.includes('<')) {
            node.textContent = inner.trim();
          }

          node.parentElement = parent;
          parent.children.push(node);

          if (inner && inner.includes('<')) {
            parseAndBuildTree(inner, node);
          }
        }
      }

      return containerNode;
    }

    it('renders fallback UI when given invalid or missing parsedContext', () => {
      const container = createFullMockDOM();
      renderInteractiveCards(container, null);

      assert.ok(container.innerHTML.includes('Interactive Tools'));
      assert.ok(container.innerHTML.includes('Enter a valid GitHub URL to unlock interactive tools.'));
    });

    it('renders all 3 cards with proper active/disabled state for File context', () => {
      const container = createFullMockDOM();
      const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/src/React.js#L15-L30');

      renderInteractiveCards(container, fileCtx);

      const deepCard = container.querySelector('[data-card-id="deep_linker"]');
      const timeCard = container.querySelector('[data-card-id="time_machine"]');
      const commitCard = container.querySelector('[data-card-id="commit_feed"]');

      assert.ok(deepCard, 'Deep linker card must exist');
      assert.ok(timeCard, 'Time machine card must exist');
      assert.ok(commitCard, 'Commit feed card must exist');

      assert.ok(deepCard.className.includes('active'));
      assert.ok(timeCard.className.includes('active'));
      assert.ok(commitCard.className.includes('active'));

      // Check prefilled inputs for deep linker from fragment #L15-L30
      const deepStart = container.querySelector('#deep-start');
      const deepEnd = container.querySelector('#deep-end');
      assert.equal(deepStart.value, '15');
      assert.equal(deepEnd.value, '30');

      // Check initial URL output
      const deepLink = container.querySelector('#deep-linker-url');
      assert.equal(deepLink.href, 'https://github.com/facebook/react/blob/main/src/React.js#L15-L30');
    });

    it('dynamically updates Deep Linker URL upon user input events', () => {
      const container = createFullMockDOM();
      const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/src/React.js');
      renderInteractiveCards(container, fileCtx);

      const deepStart = container.querySelector('#deep-start');
      const deepEnd = container.querySelector('#deep-end');
      const deepPlain = container.querySelector('#deep-plain');
      const deepLink = container.querySelector('#deep-linker-url');

      assert.equal(deepLink.href, 'https://github.com/facebook/react/blob/main/src/React.js');

      // User types line start 100
      deepStart.value = '100';
      deepStart.dispatchEvent('input');
      assert.equal(deepLink.href, 'https://github.com/facebook/react/blob/main/src/React.js#L100');

      // User checks plain toggle
      deepPlain.checked = true;
      deepPlain.dispatchEvent('change');
      assert.equal(deepLink.href, 'https://github.com/facebook/react/blob/main/src/React.js?plain=1#L100');

      // User types line end 200
      deepEnd.value = '200';
      deepEnd.dispatchEvent('input');
      assert.equal(deepLink.href, 'https://github.com/facebook/react/blob/main/src/React.js?plain=1#L100-L200');
    });

    it('dynamically updates Time Machine compare mode visibility and URL upon user select events', () => {
      const container = createFullMockDOM();
      const repoCtx = parseGithubUrl('https://github.com/facebook/react');
      renderInteractiveCards(container, repoCtx);

      const modeSelect = container.querySelector('#time-compare-mode');
      const refGroup = container.querySelector('#time-ref-group');
      const timeframeGroup = container.querySelector('#time-timeframe-group');
      const dateGroup = container.querySelector('#time-date-group');
      const timeLink = container.querySelector('#time-machine-url');

      // Initial ref mode
      assert.equal(refGroup.style.display, '');
      assert.equal(timeLink.href, 'https://github.com/facebook/react/compare/main...HEAD');

      // Switch mode to relative timeframe
      modeSelect.value = 'timeframe';
      modeSelect.dispatchEvent('change');

      assert.equal(refGroup.style.display, 'none');
      assert.equal(timeframeGroup.style.display, '');
      assert.equal(timeLink.href, 'https://github.com/facebook/react/compare/main@{1.week.ago}...main');

      // Switch mode to custom date
      modeSelect.value = 'custom_date';
      modeSelect.dispatchEvent('change');

      assert.equal(timeframeGroup.style.display, 'none');
      assert.equal(dateGroup.style.display, '');
      assert.equal(timeLink.href, 'https://github.com/facebook/react/compare/main@{1.week.ago}...main');

      // Set custom date value
      const customDateInput = container.querySelector('#time-custom-date');
      customDateInput.value = '2026-07-21';
      customDateInput.dispatchEvent('input');
      assert.equal(timeLink.href, 'https://github.com/facebook/react/compare/main@{2026-07-21}...main');
    });

    it('dynamically updates Commit Feed URL upon user input events', () => {
      const container = createFullMockDOM();
      const repoCtx = parseGithubUrl('https://github.com/facebook/react');
      renderInteractiveCards(container, repoCtx);

      const commitRef = container.querySelector('#commit-ref');
      const commitAuthor = container.querySelector('#commit-author');
      const commitPath = container.querySelector('#commit-path');
      const commitLink = container.querySelector('#commit-feed-url');

      assert.equal(commitLink.href, 'https://github.com/facebook/react/commits');

      // Type branch main
      commitRef.value = 'main';
      commitRef.dispatchEvent('input');
      assert.equal(commitLink.href, 'https://github.com/facebook/react/commits/main');

      // Type path src/index.js
      commitPath.value = 'src/index.js';
      commitPath.dispatchEvent('input');
      assert.equal(commitLink.href, 'https://github.com/facebook/react/commits/main/src/index.js');

      // Type author gaearon
      commitAuthor.value = 'gaearon';
      commitAuthor.dispatchEvent('input');
      assert.equal(commitLink.href, 'https://github.com/facebook/react/commits/main/src/index.js?author=gaearon');
    });
  });

});
