export class MockElement {
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
    this.style = {};
  }
  get className() {
    return this._className;
  }
  set className(val) {
    this._className = val || '';
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = val === null || val === undefined ? '' : String(val);
  }

  get textContent() {
    return this._textContent;
  }
  set textContent(val) {
    this._textContent = val === null || val === undefined ? '' : String(val);
    this.children = [];
    this._innerHTML = this._textContent;
  }

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map((child) => child.outerHTML).join('');
    }
    return this._innerHTML;
  }
  set innerHTML(html) {
    this._innerHTML = html === null || html === undefined ? '' : String(html);
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
        classes.forEach((c) => current.add(c));
        self.className = Array.from(current).join(' ');
        self.attributes.set('class', self.className);
      },
      remove(...classes) {
        const current = new Set((self.className || '').split(/\s+/).filter(Boolean));
        classes.forEach((c) => current.delete(c));
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
      },
    };
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  removeEventListener(event, fn) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event).filter((f) => f !== fn);
    this.listeners.set(event, arr);
  }
  dispatchEvent(eventOrString) {
    const type = typeof eventOrString === 'string' ? eventOrString : eventOrString.type;
    const target =
      typeof eventOrString === 'object' && eventOrString.target ? eventOrString.target : this;
    const callbacks = this.listeners.get(type) || [];
    callbacks.forEach((cb) => {
      cb({ target, type });
    });
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

  // fallow-ignore-next-line complexity
export function matchesSelector(el, selector) {
  if (!el || !selector) return false;
  const parts = selector.match(/#[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_-]+|\[[^\]]+\]|[a-zA-Z0-9-]+/g) || [
    selector,
  ];
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

export class MockDocument extends MockElement {
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
