/**
 * Project: GitWarp
 * Description: Core application initialization and UI event binding.
 *
 * Author: B.A. Umberger (Old Man Umby)
 * Website: https://oldmanumby.com
 * GitHub: https://github.com/oldmanumby
 *
 * Copyright (c) 2026 B.A. Umberger.
 * Released under the MIT License.
 */
import {
  createIcons,
  FileText,
  Code,
  Eye,
  Server,
  GitMerge,
  BookOpen,
  LayoutDashboard,
  Zap,
  Bot,
  Headphones,
  Star,
  Copy,
  CheckCircle,
  X,
  PlusCircle,
  Sliders,
  History,
  GitCommit,
  Key,
  ShieldCheck,
  FileDiff,
  Rss,
  Archive,
  Terminal,
  Box,
} from 'lucide';
import { parseGithubUrl } from './parser.js';
import { STANDARD_CARDS, isCardCompatible, getCardUrl } from './cards.js';
import { renderInteractiveCards } from './interactive.js';
import './style.css';

// Pure HTML escaping helper function
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safe Lucide icons initializer
  // fallow-ignore-next-line complexity
function safeCreateIcons() {
  if (typeof window !== 'undefined') {
    try {
      window.lucide?.createIcons?.();
    } catch {
      // Ignore icon errors in headless/test envs
    }
  }
  try {
    createIcons({
      icons: {
        FileText,
        Code,
        Eye,
        Server,
        GitMerge,
        BookOpen,
        LayoutDashboard,
        Zap,
        Bot,
        Headphones,
        Star,
        Copy,
        CheckCircle,
        X,
        PlusCircle,
        Sliders,
        History,
        GitCommit,
        Key,
        ShieldCheck,
        FileDiff,
        Rss,
        Archive,
        Terminal,
        Box,
      },
    });
  } catch {
    // Ignore icon errors
  }
}

// Elements
const repoInput = document.getElementById('repo-input');
const clearBtn = document.getElementById('clear-btn');
const errorMessage = document.getElementById('error-message');
const cardsGrid = document.getElementById('cards-grid');
const interactiveContainer = document.getElementById('interactive-container');
const toast = document.getElementById('toast');

let toastTimeout;
function showToast(message = 'Copied to clipboard!') {
  if (!toast) return;
  const textSpan = toast.querySelector('span');
  if (textSpan) textSpan.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function updateContextBadge(parsedContext) {
  const types = ['repo', 'user', 'file', 'commit', 'pr', 'unknown'];
  const contextName =
    parsedContext && parsedContext.valid && parsedContext.context !== 'Unknown'
      ? parsedContext.context.toLowerCase()
      : 'unknown';

  types.forEach((type) => {
    const badge = document.getElementById(`badge-${type}`);
    if (!badge) return;
    if (type === contextName) {
      badge.classList.remove('inactive');
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
      badge.classList.add('inactive');
    }
  });
}

  // fallow-ignore-next-line complexity
function renderStandardCards(parsedContext) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  const isValid = Boolean(
    parsedContext && parsedContext.valid && parsedContext.context !== 'Unknown'
  );

  if (!isValid) {
    cardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--color-muted); padding: 3rem;">
        Enter a valid GitHub URL above to see available super-swaps.
      </div>
    `;
    return;
  }

  const categories = [
    {
      title: 'Cloud IDEs & Dev Environments',
      ids: ['githubdev', 'github1s', 'vscode_dev', 'codespaces_new', 'gitpod_io', 'stackblitz'],
    },
    {
      title: 'AI & LLM Utilities',
      ids: ['boltnew', 'gitingest', 'gitmcp', 'deepwiki', 'gitpodcast'],
    },
    {
      title: 'Analytics & Visualization',
      ids: ['gitdiagram', 'githubgg', 'starhistory'],
    },
    {
      title: 'Git Operations & Raw Data',
      ids: ['patch', 'diff', 'raw_file', 'ssh_clone', 'zip_archive'],
    },
    {
      title: 'Feeds & User Identity',
      ids: ['releases_atom', 'commits_atom', 'keys', 'gpg'],
    },
  ];

  // fallow-ignore-next-line complexity
  categories.forEach((category, index) => {
    const categoryHeader = document.createElement('div');
    categoryHeader.style.gridColumn = '1 / -1';
    categoryHeader.style.textAlign = 'center';

    const hrHtml =
      index === 0
        ? ''
        : '<hr class="section-divider" style="margin-top: 2rem; margin-bottom: 2rem;" />';
    categoryHeader.innerHTML = `
      ${hrHtml}
      <h2 style="margin-bottom: 1rem;">${escapeHtml(category.title)}</h2>
    `;
    cardsGrid.appendChild(categoryHeader);

    category.ids.forEach((cardId) => {
      const card = STANDARD_CARDS.find((c) => c.id === cardId);
      if (!card) return;

      const compatible = isCardCompatible(card, parsedContext);
      const targetUrl = compatible ? getCardUrl(card, parsedContext) : null;

      const cardEl = document.createElement('div');
      cardEl.className = `card glass ${compatible ? 'active' : 'disabled'}`;
      cardEl.setAttribute('data-card-id', card.id);

      if (compatible && targetUrl) {
        cardEl.innerHTML = `
          <div class="card-icon">
            <i data-lucide="${escapeHtml(card.icon)}"></i>
          </div>
          <h3 class="card-title">${escapeHtml(card.name)}</h3>
          <div class="card-link-container">
            <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="card-link" title="${escapeHtml(targetUrl)}">
              ${escapeHtml(targetUrl.replace('https://', ''))}
            </a>
            <button class="copy-btn" data-url="${escapeHtml(targetUrl)}" aria-label="Copy ${escapeHtml(card.name)} link">
              <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
          <p class="card-description">${escapeHtml(card.description)}</p>
        `;
      } else {
        cardEl.innerHTML = `
          <div class="card-icon">
            <i data-lucide="${escapeHtml(card.icon)}"></i>
          </div>
          <h3 class="card-title">${escapeHtml(card.name)}</h3>
          <div class="card-link-container" style="opacity: 0.5;">
            <span class="card-link" style="color: var(--color-error); font-style: italic;">Requires ${escapeHtml(card.allowedContexts.join('/'))} context</span>
            <button class="copy-btn" data-url="" disabled aria-label="Copy ${escapeHtml(card.name)} link">
              <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
          <p class="card-description">${escapeHtml(card.description)}</p>
        `;
      }

      cardsGrid.appendChild(cardEl);
    });
  });
}

  // fallow-ignore-next-line complexity
function handleInput() {
  const value = repoInput ? repoInput.value.trim() : '';
  const parsedCtx = parseGithubUrl(value);

  if (errorMessage) {
    if (!value) {
      errorMessage.textContent = '';
    } else if (!parsedCtx.valid) {
      errorMessage.textContent =
        'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo)';
    } else {
      errorMessage.textContent = '';
    }
  }

  updateContextBadge(parsedCtx);
  renderStandardCards(parsedCtx);

  if (interactiveContainer) {
    renderInteractiveCards(interactiveContainer, parsedCtx);
  }

  safeCreateIcons();
}

// Event Listeners for URL Input
if (repoInput) {
  ['input', 'paste', 'keyup'].forEach((eventType) => {
    repoInput.addEventListener(eventType, () => {
      handleInput();
      if (eventType === 'paste') {
        setTimeout(handleInput, 10);
      }
    });
  });
}

// Clear Button Handler
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (repoInput) repoInput.value = '';
    handleInput();
    if (repoInput) repoInput.focus();
  });
}

// Global Copy Event Delegation for Toast Notifications
  // fallow-ignore-next-line complexity
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn || btn.hasAttribute('disabled')) return;
  const url = btn.getAttribute('data-url');
  if (url) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          showToast();
        })
        .catch(() => {
          showToast();
        });
    } else {
      showToast();
    }
  }
});

// Initial Render
safeCreateIcons();
handleInput();
