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
  PlusCircle
} from 'lucide';
import './style.css';

// Initialize Lucide icons on page load
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
    PlusCircle
  } 
});

// Services Data
const services = [
  {
    id: 'boltnew',
    name: 'bolt.new',
    icon: 'bot',
    template: 'https://bolt.new/github.com/{repoPath}',
    description: 'Imports the entire repo into an AI builder, agent standing by to edit & ship.'
  },
  {
    id: 'deepwiki',
    name: 'deepwiki.com',
    icon: 'book-open',
    template: 'https://deepwiki.com/{repoPath}',
    description: 'Auto-generates a Wikipedia-style wiki + an Ask box that answers questions and cites files.'
  },
  {
    id: 'gitdiagram',
    name: 'gitdiagram.com',
    icon: 'git-merge',
    template: 'https://gitdiagram.com/{repoPath}',
    description: 'Reads the repo and draws an interactive architecture diagram.'
  },
  {
    id: 'gitingest',
    name: 'gitingest',
    icon: 'file-text',
    template: 'https://gitingest.com/{repoPath}',
    description: 'Flattens the WHOLE repo into one prompt-friendly text + token count. Best for asking AI.'
  },
  {
    id: 'githubdev',
    name: 'github.dev',
    icon: 'code',
    template: 'https://github.dev/{repoPath}',
    description: 'Opens the repo in a full VS Code editor in your browser. (Same as pressing ".")'
  },
  {
    id: 'githubgg',
    name: 'github.gg',
    icon: 'layout-dashboard',
    template: 'https://github.gg/{repoPath}',
    description: 'A control panel for the repo: one-click copy-for-AI, security scan, quality score.'
  },
  {
    id: 'github1s',
    name: 'github1s.com',
    icon: 'eye',
    template: 'https://github1s.com/{repoPath}',
    description: 'VS Code view, classic flavor. Best for reading an unfamiliar codebase fast.'
  },
  {
    id: 'gitmcp',
    name: 'gitmcp.io',
    icon: 'server',
    template: 'https://gitmcp.io/{repoPath}',
    description: 'Turns the repo into a live MCP server your AI can query in real time.'
  },
  {
    id: 'gitpodcast',
    name: 'gitpodcast.com',
    icon: 'headphones',
    template: 'https://gitpodcast.com/{repoPath}',
    description: 'Turns a repo into an audio podcast — two hosts explaining the project.'
  },
  {
    id: 'stackblitz',
    name: 'stackblitz.com',
    icon: 'zap',
    template: 'https://stackblitz.com/github/{repoPath}',
    description: 'Boots the project in a real, working dev environment in your browser.'
  },
  {
    id: 'starhistory',
    name: 'star-history.com',
    icon: 'star',
    template: 'https://star-history.com/#{repoPath}&Date',
    description: 'Charts the repo’s stars over time. Steady climb = healthy; flat/cliff = careful.'
  }
];

// Elements
const repoInput = document.getElementById('repo-input');
const clearBtn = document.getElementById('clear-btn');
const errorMessage = document.getElementById('error-message');
const cardsContainer = document.getElementById('cards-container');

// Create Toast Element
const toast = document.createElement('div');
toast.className = 'toast';
toast.innerHTML = `<i data-lucide="check-circle"></i> Copied to clipboard!`;
document.body.appendChild(toast);
let toastTimeout;

// Regex to extract owner/repo
const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\/?.*$/;

function renderCards(repoPath = '') {
  cardsContainer.innerHTML = '';
  
  if (!repoPath) {
    // Render placeholders or empty state
    cardsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-muted); padding: 3rem;">Enter a GitHub repository URL above to see available superpowers.</div>`;
    return;
  }

  services.forEach(service => {
    const url = service.template.replace('{repoPath}', repoPath);
    
    const card = document.createElement('div');
    card.className = 'card glass';
    
    card.innerHTML = `
      <div class="card-icon">
        <i data-lucide="${service.icon}"></i>
      </div>
      <h3 class="card-title">${service.name}</h3>
      <div class="card-link-container">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="card-link" title="${url}">
          ${url.replace('https://', '')}
        </a>
        <button class="copy-btn" data-url="${url}" aria-label="Copy ${service.name} link">
          <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
      <p class="card-description">${service.description}</p>
    `;
    
    cardsContainer.appendChild(card);
  });
  
  // Re-initialize icons for new DOM elements
  createIcons({ 
    icons: {
      FileText, Code, Eye, Server, GitMerge, BookOpen, LayoutDashboard, Zap, Bot, Headphones, Star, Copy, CheckCircle, X, PlusCircle
    } 
  });

  // Add copy listeners
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(() => {
        showToast();
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  });
}

function showToast() {
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function handleInput() {
  const value = repoInput.value.trim();
  errorMessage.textContent = '';
  
  if (!value) {
    renderCards('');
    return;
  }
  
  const match = value.match(githubRegex);
  
  if (match && match[1]) {
    // Valid GitHub URL
    let repoPath = match[1];
    // Remove .git if present at the end
    if (repoPath.endsWith('.git')) {
        repoPath = repoPath.slice(0, -4);
    }
    renderCards(repoPath);
  } else {
    // Invalid URL format
    errorMessage.textContent = 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)';
    renderCards('');
  }
}

// Event Listeners
repoInput.addEventListener('input', handleInput);
repoInput.addEventListener('paste', () => {
  // Use timeout to let paste complete before evaluating
  setTimeout(handleInput, 10);
});

clearBtn.addEventListener('click', () => {
  repoInput.value = '';
  handleInput();
  repoInput.focus();
});

// Initial render
renderCards('');
