/**
 * Project: GitWarp
 * Description: Registry of swappable URL tricks and card configurations.
 * 
 * Author: B.A. Umberger (Old Man Umby)
 * Website: https://oldmanumby.com
 * GitHub: https://github.com/oldmanumby
 * 
 * Copyright (c) 2026 B.A. Umberger.
 * Released under the MIT License.
 */
/**
 * Standard Trick Cards Catalog & Compatibility System
 *
 * Exports 23 standard trick cards along with functions to evaluate context compatibility
 * and generate target URLs.
 */

/**
 * @typedef {Object} ParsedContext
 * @property {boolean} valid
 * @property {'User'|'Repo'|'File'|'Commit'|'PR'|'Unknown'} context
 * @property {string|null} owner
 * @property {string|null} repo
 * @property {string|null} ref
 * @property {string|null} filePath
 * @property {string|null} commitSha
 * @property {string|null} prNumber
 */

/**
 * @typedef {Object} StandardCard
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {Array<'User'|'Repo'|'File'|'Commit'|'PR'>} allowedContexts
 * @property {string} description
 * @property {(ctx: ParsedContext) => string|null} generateUrl
 */

/**
 * Array of 23 standard trick card definitions.
 * @type {StandardCard[]}
 */
export const STANDARD_CARDS = [
  {
    id: 'boltnew',
    name: 'bolt.new',
    icon: 'bot',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Imports the repository into an AI builder agent standing by to edit & ship.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://bolt.new/github.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'deepwiki',
    name: 'deepwiki.com',
    icon: 'book-open',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description:
      'Auto-generates a Wikipedia-style wiki and interactive Q&A assistant for the repository.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://deepwiki.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'gitdiagram',
    name: 'gitdiagram.com',
    icon: 'git-merge',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Reads the repository and draws an interactive architecture diagram.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://gitdiagram.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'gitingest',
    name: 'gitingest',
    icon: 'file-text',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Flattens repo or file into one prompt-friendly text document with token count.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://gitingest.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`;
      }
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://gitingest.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://gitingest.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`;
      }
      return `https://gitingest.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'githubdev',
    name: 'github.dev',
    icon: 'code',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Opens the repository or file in a full VS Code web editor.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://github.dev/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`;
      }
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://github.dev/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://github.dev/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`;
      }
      return `https://github.dev/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'githubgg',
    name: 'github.gg',
    icon: 'layout-dashboard',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description:
      'Repository control panel: one-click copy for AI, security scan, and quality score.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://github.gg/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'github1s',
    name: 'github1s.com',
    icon: 'eye',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Classic VS Code web view for fast read-only codebase navigation.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://github1s.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`;
      }
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://github1s.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://github1s.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`;
      }
      return `https://github1s.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'gitmcp',
    name: 'gitmcp.io',
    icon: 'server',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Converts the repository into a live MCP server for AI coding assistants.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://gitmcp.io/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'gitpodcast',
    name: 'gitpodcast.com',
    icon: 'headphones',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Generates an audio podcast with host dialogue explaining the codebase.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://gitpodcast.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'stackblitz',
    name: 'stackblitz.com',
    icon: 'zap',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Boots the repository in an interactive browser WebContainers dev environment.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://stackblitz.com/github/${ctx.owner}/${ctx.repo}?file=${ctx.filePath}`;
      }
      return `https://stackblitz.com/github/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'starhistory',
    name: 'star-history.com',
    icon: 'star',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Interactive star growth chart over time for evaluating repository health.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://star-history.com/#${ctx.owner}/${ctx.repo}&Date`;
    },
  },
  {
    id: 'keys',
    name: '.keys (SSH Public Keys)',
    icon: 'key',
    allowedContexts: ['User', 'Repo', 'File', 'Commit', 'PR'],
    description: 'Fetches all public SSH keys associated with the GitHub user account.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner) return null;
      return `https://github.com/${ctx.owner}.keys`;
    },
  },
  {
    id: 'gpg',
    name: '.gpg (GPG Public Keys)',
    icon: 'shield-check',
    allowedContexts: ['User', 'Repo', 'File', 'Commit', 'PR'],
    description: 'Fetches all public GPG signing keys associated with the GitHub user account.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner) return null;
      return `https://github.com/${ctx.owner}.gpg`;
    },
  },
  {
    id: 'patch',
    name: '.patch (Git Patch)',
    icon: 'file-diff',
    allowedContexts: ['Commit', 'PR'],
    description: 'Appends .patch to commit or PR URLs to get formatted raw Git patch files.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}.patch`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}.patch`;
      }
      return null;
    },
  },
  {
    id: 'diff',
    name: '.diff (Git Diff)',
    icon: 'file-diff',
    allowedContexts: ['Commit', 'PR'],
    description: 'Appends .diff to commit or PR URLs to get raw unified diff output.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}.diff`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}.diff`;
      }
      return null;
    },
  },
  {
    id: 'releases_atom',
    name: 'releases.atom',
    icon: 'rss',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Atom RSS feed tracking all published releases and tags for the repository.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://github.com/${ctx.owner}/${ctx.repo}/releases.atom`;
    },
  },
  {
    id: 'commits_atom',
    name: 'commits.atom',
    icon: 'rss',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Atom RSS feed tracking commit history for the repository or branch.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.ref) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/commits/${ctx.ref}.atom`;
      }
      return `https://github.com/${ctx.owner}/${ctx.repo}/commits.atom`;
    },
  },
  {
    id: 'zip_archive',
    name: 'Zip Archive',
    icon: 'archive',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Direct link to download a ZIP archive of the repository codebase.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.ref) {
        return `https://github.com/${ctx.owner}/${ctx.repo}/archive/refs/heads/${ctx.ref}.zip`;
      }
      return `https://github.com/${ctx.owner}/${ctx.repo}/archive/HEAD.zip`;
    },
  },
  {
    id: 'codespaces_new',
    name: 'codespaces.new',
    icon: 'terminal',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Instantly launches a GitHub Codespaces cloud environment for the repository.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `https://codespaces.new/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'gitpod_io',
    name: 'gitpod.io',
    icon: 'box',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Launches an automated cloud development environment on Gitpod.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`;
      }
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`;
      }
      return `https://gitpod.io/#https://github.com/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'vscode_dev',
    name: 'vscode.dev',
    icon: 'code',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Opens the repository or file in VS Code for Web without extension setup.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      if (ctx.context === 'File' && ctx.filePath) {
        return `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/blob/${ctx.ref || 'main'}/${ctx.filePath}`;
      }
      if (ctx.context === 'Commit' && ctx.commitSha) {
        return `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/commit/${ctx.commitSha}`;
      }
      if (ctx.context === 'PR' && ctx.prNumber) {
        return `https://vscode.dev/github/${ctx.owner}/${ctx.repo}/pull/${ctx.prNumber}`;
      }
      return `https://vscode.dev/github/${ctx.owner}/${ctx.repo}`;
    },
  },
  {
    id: 'ssh_clone',
    name: 'SSH Clone URL',
    icon: 'terminal',
    allowedContexts: ['Repo', 'File', 'Commit', 'PR'],
    description: 'Formats repository location into a standard Git SSH clone URL.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo) return null;
      return `git@github.com:${ctx.owner}/${ctx.repo}.git`;
    },
  },
  {
    id: 'raw_file',
    name: 'Raw File URL',
    icon: 'file-text',
    allowedContexts: ['File'],
    description: 'Direct link to fetch raw file contents from raw.githubusercontent.com.',
    generateUrl: (ctx) => {
      if (!ctx || !ctx.owner || !ctx.repo || !ctx.filePath) return null;
      return `https://raw.githubusercontent.com/${ctx.owner}/${ctx.repo}/${ctx.ref || 'main'}/${ctx.filePath}`;
    },
  },
];

/**
 * Evaluates whether a trick card is compatible with a given parsed GitHub context.
 *
 * @param {StandardCard} card
 * @param {ParsedContext} parsedContext
 * @returns {boolean}
 */
export function isCardCompatible(card, parsedContext) {
  if (!parsedContext || !parsedContext.valid || parsedContext.context === 'Unknown') {
    return false;
  }
  if (
    !card ||
    !Array.isArray(card.allowedContexts) ||
    !card.allowedContexts.includes(parsedContext.context)
  ) {
    return false;
  }
  try {
    const url = card.generateUrl(parsedContext);
    return Boolean(url && typeof url === 'string' && url.length > 0);
  } catch {
    return false;
  }
}

/**
 * Generates the target URL for a trick card and context if compatible, otherwise returns null.
 *
 * @param {StandardCard} card
 * @param {ParsedContext} parsedContext
 * @returns {string|null}
 */
export function getCardUrl(card, parsedContext) {
  if (!isCardCompatible(card, parsedContext)) {
    return null;
  }
  try {
    return card.generateUrl(parsedContext);
  } catch {
    return null;
  }
}

/**
 * Returns an array of cards that are compatible with the given parsed context.
 *
 * @param {ParsedContext} parsedContext
 * @returns {StandardCard[]}
 */
export function getCompatibleCards(parsedContext) {
  return STANDARD_CARDS.filter((card) => isCardCompatible(card, parsedContext));
}
