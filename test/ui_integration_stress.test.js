import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import { MockElement, MockDocument, matchesSelector } from './helpers.js';

async function setupEnv() {
  const doc = new MockDocument();

  const repoInput = doc.createElement('input');
  repoInput.id = 'repo-input';
  doc.registerElement(repoInput);

  const clearBtn = doc.createElement('button');
  clearBtn.id = 'clear-btn';
  doc.registerElement(clearBtn);

  const errorMessage = doc.createElement('p');
  errorMessage.id = 'error-message';
  doc.registerElement(errorMessage);

  const badges = ['repo', 'user', 'file', 'commit', 'pr', 'unknown'].map((type) => {
    const b = doc.createElement('span');
    b.id = `badge-${type}`;
    b.className = `context-badge context-${type} ${type === 'unknown' ? 'active' : 'inactive'}`;
    b.textContent = type.toUpperCase();
    doc.registerElement(b);
    return b;
  });

  const contextBadge = {
    get textContent() {
      const active = badges.find((b) => b.classList.contains('active'));
      if (active) {
        const type = active.id.split('-')[1];
        if (type === 'pr') return 'PR';
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
      return 'Unknown';
    },
    get className() {
      const active = badges.find((b) => b.classList.contains('active'));
      return active ? active._className : 'context-badge context-unknown inactive';
    },
    get classList() {
      const active =
        badges.find((b) => b.classList.contains('active')) ||
        badges.find((b) => b.id === 'badge-unknown');
      return active.classList;
    },
  };

  const cardsGrid = doc.createElement('section');
  cardsGrid.id = 'cards-grid';
  doc.registerElement(cardsGrid);

  const interactiveContainer = doc.createElement('section');
  interactiveContainer.id = 'interactive-container';
  doc.registerElement(interactiveContainer);

  const toast = doc.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  const toastSpan = doc.createElement('span');
  toastSpan.textContent = 'Copied to clipboard!';
  toast.appendChild(toastSpan);
  doc.registerElement(toast);

  globalThis.document = doc;
  globalThis.window = {
    lucide: { createIcons: () => {} },
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: { writeText: async () => Promise.resolve() },
    },
    writable: true,
    configurable: true,
  });

  const mainJsPath = path.resolve('./src/main.js');
  let mainJsCode = fs.readFileSync(mainJsPath, 'utf8');
  mainJsCode = mainJsCode.replace(/import\s+['"]\.\/style\.css['"];?/, '// css omitted');

  const parserUrl = pathToFileURL(path.resolve('./src/parser.js')).href;
  const cardsUrl = pathToFileURL(path.resolve('./src/cards.js')).href;
  const interactiveUrl = pathToFileURL(path.resolve('./src/interactive.js')).href;
  const lucideUrl = pathToFileURL(path.resolve('./node_modules/lucide/dist/esm/lucide.mjs')).href;

  mainJsCode = mainJsCode
    .replace('"lucide"', `"${lucideUrl}"`)
    .replace("'lucide'", `'${lucideUrl}'`)
    .replace('"./parser.js"', `"${parserUrl}"`)
    .replace("'./parser.js'", `'${parserUrl}'`)
    .replace('"./cards.js"', `"${cardsUrl}"`)
    .replace("'./cards.js'", `'${cardsUrl}'`)
    .replace('"./interactive.js"', `"${interactiveUrl}"`)
    .replace("'./interactive.js'", `'${interactiveUrl}'`);

  const nonce = Math.random().toString(36).substring(2) + Date.now();
  const tmpFile = path.resolve(`./.tmp-main-${nonce}.js`);
  fs.writeFileSync(tmpFile, mainJsCode);
  const fileUrl = pathToFileURL(tmpFile).href;
  await import(fileUrl);
  fs.unlinkSync(tmpFile);

  return {
    doc,
    repoInput,
    clearBtn,
    errorMessage,
    contextBadge,
    cardsGrid,
    interactiveContainer,
    toast,
  };
}

describe('Empirical UI Stress Test Harness', () => {
  describe('1. Null/Undefined & Falsy Input Handlers', () => {
    it('handles setting repoInput.value to empty, whitespace, null, or undefined', async () => {
      const { repoInput, errorMessage, contextBadge, cardsGrid } = await setupEnv();

      // Test null value assignment
      repoInput.value = null;
      repoInput.dispatchEvent('input');
      assert.equal(repoInput.value, '');
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));

      // Test undefined value assignment
      repoInput.value = undefined;
      repoInput.dispatchEvent('input');
      assert.equal(repoInput.value, '');
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.equal(errorMessage.textContent, '');

      // Test keyup with empty string
      repoInput.value = '';
      repoInput.dispatchEvent('keyup');
      assert.equal(errorMessage.textContent, '');
    });
  });

  describe('2. Whitespace Edge Cases', () => {
    it('trims leading, trailing, and padded whitespace gracefully', async () => {
      const { repoInput, errorMessage, contextBadge } = await setupEnv();

      // Padded valid URL
      repoInput.value = '   \t  https://github.com/facebook/react  \n\r  ';
      repoInput.dispatchEvent('input');
      assert.equal(contextBadge.textContent, 'Repo');
      assert.equal(errorMessage.textContent, '');

      // Whitespace only
      repoInput.value = '   \t \n \r  ';
      repoInput.dispatchEvent('input');
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.equal(errorMessage.textContent, '');

      // Non-breaking spaces (\u00A0)
      repoInput.value = '\u00A0\u00A0https://github.com/facebook/react\u00A0\u00A0';
      repoInput.dispatchEvent('input');
      assert.equal(contextBadge.textContent, 'Repo');
      assert.equal(errorMessage.textContent, '');
    });
  });

  describe('3. Invalid URLs & Malicious Payload Stress', () => {
    it('handles various non-GitHub and invalid URL formats seamlessly', async () => {
      const { repoInput, errorMessage, contextBadge, cardsGrid, interactiveContainer } =
        await setupEnv();

      const invalidInputs = [
        'http://google.com',
        'https://gitlab.com/owner/repo',
        'ftp://github.com/owner/repo',
        'javascript:alert(1)',
        'https://github.com',
        'https://github.com/',
        'https://github.com///',
        'not-a-url',
        'https://github.com/settings/profile',
        'https://github.com/explore',
      ];

      for (const invalidInput of invalidInputs) {
        repoInput.value = invalidInput;
        repoInput.dispatchEvent('input');

        assert.equal(
          contextBadge.textContent,
          'Unknown',
          `Expected Unknown context for: ${invalidInput}`
        );
        assert.equal(contextBadge.className, 'context-badge context-unknown active');
        assert.equal(
          errorMessage.textContent,
          'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)'
        );
        assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));
        assert.ok(
          interactiveContainer.innerHTML.includes(
            'Enter a valid GitHub URL to unlock interactive tools'
          )
        );
      }
    });
  });

  describe('4. Rapid Paste Events & Event Flooding', () => {
    it('handles rapid paste events with pending setTimeout without state desynchronization', async () => {
      const { repoInput, contextBadge, cardsGrid } = await setupEnv();

      // Trigger 100 paste events alternating between File URL and Repo URL
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          repoInput.value = 'https://github.com/owner/repo/blob/main/file.js';
        } else {
          repoInput.value = 'https://github.com/owner/repo';
        }
        repoInput.dispatchEvent('paste');
      }

      // Final paste event is set to Repo context
      repoInput.value = 'https://github.com/owner/repo';
      repoInput.dispatchEvent('paste');

      // Wait 50ms for all pending timeouts to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      assert.equal(contextBadge.textContent, 'Repo');
      assert.ok(cardsGrid.innerHTML.includes('https://bolt.new/github.com/owner/repo'));
    });
  });

  describe('5. Rapid Context Changes & Transition Integrity', () => {
    it('transitions smoothly across all context types in rapid succession', async () => {
      const { repoInput, contextBadge, interactiveContainer } = await setupEnv();

      const sequence = [
        { url: 'https://github.com/octocat', context: 'User' },
        { url: 'https://github.com/octocat/Spoon-Knife', context: 'Repo' },
        { url: 'https://github.com/octocat/Spoon-Knife/blob/main/index.html', context: 'File' },
        {
          url: 'https://github.com/octocat/Spoon-Knife/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d',
          context: 'Commit',
        },
        { url: 'https://github.com/octocat/Spoon-Knife/pull/15', context: 'PR' },
        {
          url: 'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/index.html',
          context: 'File',
        },
        { url: '', context: 'Unknown' },
      ];

      for (const step of sequence) {
        repoInput.value = step.url;
        repoInput.dispatchEvent('input');

        assert.equal(contextBadge.textContent, step.context, `Mismatch for URL: ${step.url}`);
        if (step.context === 'File') {
          assert.ok(interactiveContainer.innerHTML.includes('data-card-id="deep_linker"'));
        } else if (step.context === 'Repo') {
          assert.ok(interactiveContainer.innerHTML.includes('data-card-id="time_machine"'));
          assert.ok(interactiveContainer.innerHTML.includes('data-card-id="commit_feed"'));
        }
      }
    });
  });

  describe('6. Clear Button Operations', () => {
    it('clears input, resets error, resets badge, resets grid, and focuses input', async () => {
      const { repoInput, clearBtn, errorMessage, contextBadge, cardsGrid } = await setupEnv();

      repoInput.value = 'invalid-url-here';
      repoInput.dispatchEvent('input');
      assert.equal(
        errorMessage.textContent,
        'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)'
      );

      // Click clear button
      clearBtn.dispatchEvent('click');

      assert.equal(repoInput.value, '');
      assert.equal(repoInput.isFocused, true);
      assert.equal(errorMessage.textContent, '');
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));
    });
  });
});
