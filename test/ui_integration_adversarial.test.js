import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// --- Lightweight DOM Mock implementation for Node.js ---
class MockElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.attributes = new Map();
    if (id) this.attributes.set('id', id);
    if (className) this.attributes.set('class', className);
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this._value = '';
    this._textContent = '';
    this._innerHTML = '';
    this.isFocused = false;
  }

  get value() { return this._value; }
  set value(val) { this._value = String(val ?? ''); }

  get textContent() { return this._textContent; }
  set textContent(val) {
    this._textContent = String(val ?? '');
    this.children = [];
    this._innerHTML = String(val ?? '');
  }

  get innerHTML() {
    if (this.children.length > 0 && !this._innerHTML) {
      return this.children.map(child => child.outerHTML).join('');
    }
    return this._innerHTML;
  }
  set innerHTML(html) {
    this._innerHTML = String(html ?? '');
    this.children = [];
    this.parseInnerHTML(this._innerHTML);
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = Array.from(this.attributes.entries())
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    const attrStr = attrs ? ' ' + attrs : '';
    return `<${tag}${attrStr}>${this.innerHTML}</${tag}>`;
  }

  parseInnerHTML(html) {
    this._textContent = html.replace(/<[^>]*>/g, '');

    const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>(.*?)(?:<\/\1>|(?=<[a-zA-Z0-9-]+)|$)/gs;
    tagRegex.lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1];
      const attrStr = match[2];
      const innerStr = match[3];

      const child = new MockElement(tagName);
      child.parentElement = this;

      const attrRegex = /([a-zA-Z0-9-.]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        const key = attrMatch[1];
        const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        child.setAttribute(key, val);
        if (key === 'id') child.id = val;
        if (key === 'class') child.className = val;
        if (key === 'disabled') child.disabled = true;
      }

      if (innerStr.trim()) {
        child.innerHTML = innerStr;
      }
      this.children.push(child);
    }
  }

  setAttribute(key, val) {
    this.attributes.set(key, String(val));
    if (key === 'class') this.className = String(val);
    if (key === 'id') this.id = String(val);
    if (key === 'disabled') this.disabled = true;
  }
  getAttribute(key) {
    return this.attributes.get(key) ?? null;
  }
  removeAttribute(key) {
    this.attributes.delete(key);
    if (key === 'class') this.className = '';
    if (key === 'id') this.id = '';
    if (key === 'disabled') this.disabled = false;
  }
  hasAttribute(key) {
    return this.attributes.has(key);
  }

  get classList() {
    const self = this;
    return {
      add(...classes) {
        const current = new Set((self.className || '').split(/\s+/).filter(Boolean));
        classes.forEach(c => current.add(c));
        self.className = Array.from(current).join(' ');
        self.attributes.set('class', self.className);
      },
      remove(...classes) {
        const current = new Set((self.className || '').split(/\s+/).filter(Boolean));
        classes.forEach(c => current.delete(c));
        self.className = Array.from(current).join(' ');
        self.attributes.set('class', self.className);
      },
      contains(c) {
        return (self.className || '').split(/\s+/).includes(c);
      },
      toggle(c, force) {
        if (force === true) this.add(c);
        else if (force === false) this.remove(c);
        else if (this.contains(c)) this.remove(c);
        else this.add(c);
      }
    };
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  removeEventListener(event, fn) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event).filter(f => f !== fn);
    this.listeners.set(event, arr);
  }
  dispatchEvent(event) {
    const evt = typeof event === 'string' ? { type: event, target: this } : event;
    if (!evt.target) evt.target = this;

    const arr = this.listeners.get(evt.type) || [];
    arr.forEach(fn => fn(evt));
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSelector(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  focus() {
    this.isFocused = true;
  }
}

function matchesSelector(el, selector) {
  if (!el || !selector) return false;
  const parts = selector.match(/#[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_-]+|\[[^\]]+\]|[a-zA-Z0-9-]+/g) || [selector];
  for (const part of parts) {
    if (part.startsWith('#')) {
      if (el.id !== part.slice(1)) return false;
    } else if (part.startsWith('.')) {
      if (!el.classList.contains(part.slice(1))) return false;
    } else if (part.startsWith('[')) {
      const attrMatch = part.match(/\[([a-zA-Z0-9-.]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/);
      if (attrMatch) {
        const key = attrMatch[1];
        const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
        if (!el.hasAttribute(key)) return false;
        if (val !== undefined && el.getAttribute(key) !== val) return false;
      }
    } else {
      if (el.tagName !== part.toUpperCase()) return false;
    }
  }
  return true;
}

class MockDocument extends MockElement {
  constructor() {
    super('DOCUMENT', '', '');
    this.elementsById = new Map();
  }

  registerElement(el) {
    if (el.id) {
      this.elementsById.set(el.id, el);
    }
    this.appendChild(el);
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }

  createElement(tagName) {
    return new MockElement(tagName);
  }
}

function setMockNavigator(navObj) {
  Object.defineProperty(globalThis, 'navigator', {
    value: navObj,
    writable: true,
    configurable: true
  });
}

// --- Helper to setup DOM and import main.js ---
async function setupEnvironment() {
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

  const contextBadge = doc.createElement('span');
  contextBadge.id = 'context-badge';
  contextBadge.className = 'context-badge context-unknown inactive';
  contextBadge.textContent = 'Unknown';
  doc.registerElement(contextBadge);

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
    lucide: {
      createIcons: () => {}
    }
  };
  setMockNavigator({
    clipboard: {
      writeText: async () => Promise.resolve()
    }
  });

  // Transform main.js to remove style.css and use absolute file URLs for local modules
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
  const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(mainJsCode) + '#' + nonce;
  await import(dataUri);

  return {
    doc,
    repoInput,
    clearBtn,
    errorMessage,
    contextBadge,
    cardsGrid,
    interactiveContainer,
    toast
  };
}

describe('UI Integration Adversarial Tests (src/main.js & index.html)', () => {

  describe('1. Input Sequence Transitions', () => {

    it('handles full sequence: valid Repo -> valid File -> invalid URL -> empty string -> raw domain', async () => {
      const {
        doc,
        repoInput,
        clearBtn,
        errorMessage,
        contextBadge,
        cardsGrid,
        interactiveContainer
      } = await setupEnvironment();

      // State 0: Initial render state (Empty input)
      assert.equal(repoInput.value, '');
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.equal(contextBadge.className, 'context-badge context-unknown inactive');
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));

      // Step 1: Pasting valid Repo URL
      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('paste');
      
      assert.equal(contextBadge.textContent, 'Repo');
      assert.ok(contextBadge.classList.contains('context-repo'));
      assert.ok(contextBadge.classList.contains('active'));
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('data-card-id="boltnew"'));
      assert.ok(cardsGrid.innerHTML.includes('https://bolt.new/github.com/facebook/react'));
      assert.ok(interactiveContainer.innerHTML.includes('data-card-id="time_machine"'));
      assert.ok(interactiveContainer.innerHTML.includes('data-card-id="commit_feed"'));

      // Step 2: Pasting valid File URL with line numbers
      repoInput.value = 'https://github.com/facebook/react/blob/main/package.json#L5-L15';
      repoInput.dispatchEvent('input');

      assert.equal(contextBadge.textContent, 'File');
      assert.ok(contextBadge.classList.contains('context-file'));
      assert.ok(contextBadge.classList.contains('active'));
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('data-card-id="raw_file"'));
      assert.ok(cardsGrid.innerHTML.includes('https://raw.githubusercontent.com/facebook/react/main/package.json'));
      assert.ok(interactiveContainer.innerHTML.includes('data-card-id="deep_linker"'));

      // Step 3: Pasting invalid URL
      repoInput.value = 'https://notgithub.com/facebook/react';
      repoInput.dispatchEvent('input');

      assert.equal(contextBadge.textContent, 'Unknown');
      assert.ok(contextBadge.classList.contains('context-unknown'));
      assert.ok(contextBadge.classList.contains('inactive'));
      assert.equal(errorMessage.textContent, 'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)');
      assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));
      assert.ok(interactiveContainer.innerHTML.includes('Enter a valid GitHub URL to unlock interactive tools'));

      // Step 4: Transition to empty string via Clear Button click
      clearBtn.dispatchEvent('click');

      assert.equal(repoInput.value, '');
      assert.equal(repoInput.isFocused, true);
      assert.equal(contextBadge.textContent, 'Unknown');
      assert.ok(contextBadge.classList.contains('context-unknown'));
      assert.ok(contextBadge.classList.contains('inactive'));
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('Enter a valid GitHub URL above'));
      assert.ok(interactiveContainer.innerHTML.includes('Enter a valid GitHub URL to unlock interactive tools'));

      // Step 5: Pasting raw domain URL
      repoInput.value = 'https://raw.githubusercontent.com/facebook/react/main/src/index.js';
      repoInput.dispatchEvent('input');

      assert.equal(contextBadge.textContent, 'File');
      assert.ok(contextBadge.classList.contains('context-file'));
      assert.ok(contextBadge.classList.contains('active'));
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('data-card-id="raw_file"'));
      assert.ok(interactiveContainer.innerHTML.includes('data-card-id="deep_linker"'));
    });

  });

  describe('2. Rapid Input Events & Synchronization Resilience', () => {

    it('resists rapid event firing (input, paste, keyup) without race conditions or corrupt state', async () => {
      const {
        repoInput,
        contextBadge,
        errorMessage,
        cardsGrid
      } = await setupEnvironment();

      const urls = [
        'https://github.com/torvalds/linux',
        'https://github.com/torvalds/linux/blob/master/README',
        'invalid-url-123',
        '',
        'https://github.com/vuejs/core'
      ];

      // Rapidly fire input, paste, and keyup events in quick succession
      for (let i = 0; i < 50; i++) {
        const targetUrl = urls[i % urls.length];
        repoInput.value = targetUrl;
        repoInput.dispatchEvent('input');
        repoInput.dispatchEvent('paste');
        repoInput.dispatchEvent('keyup');
      }

      // Wait for paste event setTimeout(handleInput, 10) to finish
      await new Promise(resolve => setTimeout(resolve, 30));

      // Final state must strictly reflect the last URL ('https://github.com/vuejs/core')
      assert.equal(repoInput.value, 'https://github.com/vuejs/core');
      assert.equal(contextBadge.textContent, 'Repo');
      assert.equal(errorMessage.textContent, '');
      assert.ok(cardsGrid.innerHTML.includes('https://bolt.new/github.com/vuejs/core'));
    });

    it('handles out-of-order event dispatch gracefully', async () => {
      const { repoInput, contextBadge } = await setupEnvironment();

      // Dispatch paste with URL A, then immediately input with URL B
      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('paste');

      repoInput.value = 'https://github.com/facebook/react/blob/main/package.json';
      repoInput.dispatchEvent('input');

      // Wait for paste timeout
      await new Promise(resolve => setTimeout(resolve, 30));

      // Must be File context from final input value
      assert.equal(contextBadge.textContent, 'File');
    });

  });

  describe('3. Clipboard Fallback Handling', () => {

    it('invokes navigator.clipboard.writeText when clipboard API is available and resolves', async () => {
      const { doc, repoInput, toast } = await setupEnvironment();

      let copiedText = '';
      setMockNavigator({
        clipboard: {
          writeText: async (text) => {
            copiedText = text;
            return Promise.resolve();
          }
        }
      });

      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('input');

      // Find a copy button in the standard cards grid
      const copyBtn = doc.querySelector('.copy-btn[data-url]');
      assert.ok(copyBtn, 'Copy button should exist in cards grid');

      // Dispatch click event on the copy button
      doc.dispatchEvent({ type: 'click', target: copyBtn });

      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 10));

      assert.ok(copiedText.includes('facebook/react'));
      assert.ok(toast.classList.contains('show'));
    });

    it('falls back gracefully to showing toast when navigator.clipboard is unavailable', async () => {
      const { doc, repoInput, toast } = await setupEnvironment();

      // Simulate navigator without clipboard API (e.g. non-secure context or older browser)
      setMockNavigator({});

      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('input');

      const copyBtn = doc.querySelector('.copy-btn[data-url]');
      assert.ok(copyBtn);

      // Should not throw uncaught TypeError
      assert.doesNotThrow(() => {
        doc.dispatchEvent({ type: 'click', target: copyBtn });
      });

      assert.ok(toast.classList.contains('show'));
    });

    it('handles navigator.clipboard.writeText promise rejections (permission denied)', async () => {
      const { doc, repoInput, toast } = await setupEnvironment();

      // Simulate rejection from clipboard permission failure
      setMockNavigator({
        clipboard: {
          writeText: async () => Promise.reject(new Error('Permission denied by user'))
        }
      });

      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('input');

      const copyBtn = doc.querySelector('.copy-btn[data-url]');
      assert.ok(copyBtn);

      doc.dispatchEvent({ type: 'click', target: copyBtn });

      // Wait for rejection handler (.catch)
      await new Promise(resolve => setTimeout(resolve, 20));

      assert.ok(toast.classList.contains('show'));
    });

    it('ignores clicks on disabled copy buttons or elements without data-url', async () => {
      const { doc, repoInput, toast } = await setupEnvironment();

      let writeCalled = false;
      setMockNavigator({
        clipboard: {
          writeText: async () => {
            writeCalled = true;
            return Promise.resolve();
          }
        }
      });

      // Set to Repo context so that cards requiring File context (like Raw File) are disabled
      repoInput.value = 'https://github.com/facebook/react';
      repoInput.dispatchEvent('input');

      toast.classList.remove('show');

      // Find a disabled copy button
      const disabledBtn = doc.querySelector('.copy-btn[disabled]');
      assert.ok(disabledBtn, 'Disabled copy button should exist for context mismatch card');

      doc.dispatchEvent({ type: 'click', target: disabledBtn });

      await new Promise(resolve => setTimeout(resolve, 10));

      assert.equal(writeCalled, false, 'writeText should not be called for disabled button');
      assert.equal(toast.classList.contains('show'), false, 'Toast should not be shown for disabled button');
    });

    it('ignores click events on random non-copy DOM elements', async () => {
      const { doc, toast } = await setupEnvironment();

      let writeCalled = false;
      setMockNavigator({
        clipboard: {
          writeText: async () => {
            writeCalled = true;
            return Promise.resolve();
          }
        }
      });

      toast.classList.remove('show');

      const randomDiv = doc.createElement('div');
      doc.dispatchEvent({ type: 'click', target: randomDiv });

      assert.equal(writeCalled, false);
      assert.equal(toast.classList.contains('show'), false);
    });

  });

  describe('4. Edge Cases & Resilience', () => {

    it('handles extremely long URL strings (10,000+ chars) safely', async () => {
      const { repoInput, errorMessage, contextBadge } = await setupEnvironment();

      const hugeUrl = 'https://github.com/owner/repo/blob/main/' + 'a'.repeat(10000);
      repoInput.value = hugeUrl;
      repoInput.dispatchEvent('input');

      assert.equal(contextBadge.textContent, 'File');
      assert.equal(errorMessage.textContent, '');
    });

    it('prevents XSS injection when input contains HTML/script tags', async () => {
      const { repoInput, errorMessage, cardsGrid } = await setupEnvironment();

      // Test raw script tag without URL
      repoInput.value = '<script>alert(1)</script>';
      repoInput.dispatchEvent('input');

      assert.equal(errorMessage.textContent, 'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)');
      assert.ok(!cardsGrid.innerHTML.includes('<script>alert(1)</script>'));

      // Test URL containing script tag (URL encoded safely)
      repoInput.value = 'https://github.com/owner/repo<script>alert(1)</script>';
      repoInput.dispatchEvent('input');

      assert.equal(errorMessage.textContent, '');
      assert.ok(!cardsGrid.innerHTML.includes('<script>alert(1)</script>'));
      assert.ok(cardsGrid.innerHTML.includes('%3Cscript%3Ealert(1)%3C'));
    });

  });

});
