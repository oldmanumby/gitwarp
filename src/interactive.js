/**
 * Pure HTML escaping helper function.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks whether an interactive card is compatible with the given parsed GitHub context.
 *
 * @param {string|{id: string}} cardId
 * @param {Object} parsedContext
 * @returns {boolean}
 */
export function isInteractiveCardCompatible(cardId, parsedContext) {
  if (!parsedContext || typeof parsedContext !== 'object' || !parsedContext.valid) {
    return false;
  }
  const id = typeof cardId === 'string' ? cardId : (cardId && typeof cardId === 'object' ? cardId.id : null);
  if (!id) return false;

  const allowedContexts = {
    deep_linker: ['File'],
    time_machine: ['Repo', 'File'],
    commit_feed: ['Repo', 'File']
  };

  const allowed = allowedContexts[id];
  if (!allowed) return false;

  return allowed.includes(parsedContext.context);
}

/**
 * Builds the URL for the Deep Linker card.
 *
 * @param {Object} parsedContext
 * @param {Object} [options={}]
 * @returns {string|null}
 */
export function buildDeepLinkerUrl(parsedContext, options = {}) {
  if (!parsedContext || typeof parsedContext !== 'object' || !parsedContext.valid || parsedContext.context !== 'File') {
    return null;
  }
  const { owner, repo, ref, filePath } = parsedContext;
  if (!owner || !repo || !filePath) return null;

  const effectiveRef = ref || 'main';
  const baseUrl = `https://github.com/${owner}/${repo}/blob/${effectiveRef}/${filePath}`;

  const opts = options || {};

  // Determine lineStart
  let start = null;
  if ('lineStart' in opts) {
    if (opts.lineStart !== null && opts.lineStart !== undefined && opts.lineStart !== '') {
      const parsed = parseInt(String(opts.lineStart), 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        start = parsed;
      }
    }
  } else if (parsedContext.lineStart !== null && parsedContext.lineStart !== undefined) {
    const parsed = parseInt(String(parsedContext.lineStart), 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      start = parsed;
    }
  }

  // Determine lineEnd
  let end = null;
  if ('lineEnd' in opts) {
    if (opts.lineEnd !== null && opts.lineEnd !== undefined && opts.lineEnd !== '') {
      const parsed = parseInt(String(opts.lineEnd), 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        end = parsed;
      }
    }
  } else if (parsedContext.lineEnd !== null && parsedContext.lineEnd !== undefined) {
    const parsed = parseInt(String(parsedContext.lineEnd), 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      end = parsed;
    }
  }

  // Handle inverted line ranges (swap if end < start)
  if (start !== null && end !== null && end < start) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Construct fragment
  let fragment = '';
  if (start !== null && end !== null) {
    fragment = start === end ? `#L${start}` : `#L${start}-L${end}`;
  } else if (start !== null) {
    fragment = `#L${start}`;
  } else if (end !== null) {
    fragment = `#L${end}`;
  }

  // Determine plain toggle strictly
  let isPlain = false;
  if ('plainToggle' in opts && opts.plainToggle !== undefined && opts.plainToggle !== null) {
    const pt = opts.plainToggle;
    if (typeof pt === 'boolean') {
      isPlain = pt;
    } else if (typeof pt === 'string') {
      const lower = pt.toLowerCase().trim();
      if (lower === 'true' || lower === '1') {
        isPlain = true;
      } else if (lower === 'false' || lower === '0') {
        isPlain = false;
      } else {
        isPlain = Boolean(pt);
      }
    } else if (typeof pt === 'number') {
      isPlain = pt === 1;
    } else {
      isPlain = Boolean(pt);
    }
  } else {
    isPlain = parsedContext.queryParams?.plain === '1' || Boolean(parsedContext.isRaw);
  }

  const queryString = isPlain ? '?plain=1' : '';

  return `${baseUrl}${queryString}${fragment}`;
}

/**
 * Safely URL-encodes a ref string by path segment (preserving slashes while encoding spaces and special characters).
 *
 * @param {string} refStr
 * @returns {string}
 */
function safeEncodeRef(refStr) {
  if (refStr === null || refStr === undefined) return '';
  const str = String(refStr).trim();
  if (!str) return '';
  return str.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

/**
 * Builds the URL for the Time Machine Compare card.
 *
 * @param {Object} parsedContext
 * @param {Object} [options={}]
 * @returns {string|null}
 */
export function buildTimeMachineUrl(parsedContext, options = {}) {
  if (!parsedContext || typeof parsedContext !== 'object' || !parsedContext.valid) {
    return null;
  }
  if (parsedContext.context !== 'Repo' && parsedContext.context !== 'File') {
    return null;
  }
  const { owner, repo, filePath } = parsedContext;
  if (!owner || !repo) return null;

  const opts = options || {};
  const rawBaseRef = (opts.baseRef !== undefined && opts.baseRef !== null && String(opts.baseRef).trim())
    ? String(opts.baseRef).trim()
    : (parsedContext.ref || 'main');

  const baseRef = safeEncodeRef(rawBaseRef);

  const compareMode = opts.compareMode || 'ref';
  let compareTarget = '';

  if (compareMode === 'timeframe') {
    const timeframe = (opts.timeframe !== undefined && opts.timeframe !== null && String(opts.timeframe).trim())
      ? String(opts.timeframe).trim()
      : '1.week.ago';
    compareTarget = `${baseRef}@{${timeframe}}...${baseRef}`;
  } else if (compareMode === 'custom_date') {
    const dateVal = (opts.customDate !== undefined && opts.customDate !== null && String(opts.customDate).trim())
      ? String(opts.customDate).trim()
      : '';
    if (dateVal) {
      compareTarget = `${baseRef}@{${dateVal}}...${baseRef}`;
    } else {
      compareTarget = `${baseRef}@{1.week.ago}...${baseRef}`;
    }
  } else {
    // Default: Ref mode ('ref')
    const rawCompareRef = (opts.compareRef !== undefined && opts.compareRef !== null && String(opts.compareRef).trim())
      ? String(opts.compareRef).trim()
      : '';
    if (rawCompareRef) {
      compareTarget = `${baseRef}...${safeEncodeRef(rawCompareRef)}`;
    } else {
      compareTarget = `${baseRef}...HEAD`;
    }
  }

  let baseUrl = `https://github.com/${owner}/${repo}/compare/${compareTarget}`;

  // File path filter handling
  const includeFilePath = opts.includeFilePath !== undefined ? Boolean(opts.includeFilePath) : true;
  const pathValue = opts.filePath || opts.pathInput || (parsedContext.context === 'File' ? filePath : null);

  if (includeFilePath && pathValue) {
    baseUrl += `?path=${encodeURIComponent(pathValue)}`;
  }

  return baseUrl;
}

/**
 * Builds the URL for the Commit Feed card.
 *
 * @param {Object} parsedContext
 * @param {Object} [options={}]
 * @returns {string|null}
 */
export function buildCommitFeedUrl(parsedContext, options = {}) {
  if (!parsedContext || typeof parsedContext !== 'object' || !parsedContext.valid) {
    return null;
  }
  if (parsedContext.context !== 'Repo' && parsedContext.context !== 'File') {
    return null;
  }
  const { owner, repo } = parsedContext;
  if (!owner || !repo) return null;

  const opts = options || {};

  const ref = opts.refInput !== undefined && opts.refInput !== null
    ? String(opts.refInput).trim()
    : (parsedContext.ref || '').trim();

  const rawPath = opts.pathInput !== undefined && opts.pathInput !== null
    ? String(opts.pathInput).trim()
    : (parsedContext.filePath || '').trim();

  const author = opts.authorInput !== undefined && opts.authorInput !== null
    ? String(opts.authorInput).trim()
    : (parsedContext.queryParams?.author || '').trim();

  const cleanPath = rawPath.replace(/^\/+/, '');

  let urlPath = `https://github.com/${owner}/${repo}/commits`;

  const encodedRef = ref ? encodeURIComponent(ref) : '';
  const encodedPath = cleanPath ? cleanPath.split('/').map(encodeURIComponent).join('/') : '';

  if (ref && cleanPath) {
    urlPath += `/${encodedRef}/${encodedPath}`;
  } else if (ref && !cleanPath) {
    urlPath += `/${encodedRef}`;
  } else if (!ref && cleanPath) {
    urlPath += `/HEAD/${encodedPath}`;
  }

  if (author) {
    urlPath += `?author=${encodeURIComponent(author)}`;
  }

  return urlPath;
}

/**
 * Renders full-width interactive cards into a container DOM element.
 *
 * @param {HTMLElement} containerEl
 * @param {Object} parsedContext
 */
export function renderInteractiveCards(containerEl, parsedContext) {
  if (!containerEl || typeof containerEl !== 'object') return;

  const isContextValid = Boolean(parsedContext && typeof parsedContext === 'object' && parsedContext.valid && parsedContext.context !== 'Unknown');

  if (!isContextValid) {
    containerEl.innerHTML = `
      <div class="interactive-section-title">
        <h2><i data-lucide="sliders"></i> Interactive Tools</h2>
      </div>
      <div class="interactive-grid">
        <div class="card glass card-interactive disabled" style="text-align: center; color: var(--color-muted); padding: 2rem;">
          Enter a valid GitHub URL to unlock interactive tools.
        </div>
      </div>
    `;
    return;
  }

  const isDeepLinker = isInteractiveCardCompatible('deep_linker', parsedContext);
  const isTimeMachine = isInteractiveCardCompatible('time_machine', parsedContext);
  const isCommitFeed = isInteractiveCardCompatible('commit_feed', parsedContext);

  const initialDeepUrl = isDeepLinker ? buildDeepLinkerUrl(parsedContext) : null;
  const initialTimeUrl = isTimeMachine ? buildTimeMachineUrl(parsedContext) : null;
  const initialCommitUrl = isCommitFeed ? buildCommitFeedUrl(parsedContext) : null;

  const html = `
    <div class="interactive-section-title">
      <h2><i data-lucide="sliders"></i> Interactive Tools</h2>
    </div>
    <div class="interactive-grid">
      <!-- Deep Linker Card -->
      <div class="card glass card-interactive ${isDeepLinker ? 'active' : 'disabled'}" data-card-id="deep_linker">
        <div class="card-header">
          <div class="card-icon"><i data-lucide="file-text"></i></div>
          <div class="card-header-text">
            <h3 class="card-title">Deep Linker</h3>
            <span class="context-badge ${isDeepLinker ? 'active' : 'inactive'}">
              ${isDeepLinker ? 'File Context' : 'Context Mismatch'}
            </span>
          </div>
        </div>
        <p class="card-description">Target precise code line numbers, line ranges, and raw text views.</p>
        ${!isDeepLinker ? `<div class="context-notice">Deep Linker requires a <strong>File</strong> context URL (current: ${escapeHtml(parsedContext.context)}).</div>` : ''}

        <div class="interactive-controls">
          <div class="form-group">
            <label for="deep-start">Line Start</label>
            <input type="number" id="deep-start" min="1" class="interactive-input" placeholder="Start (e.g. 10)" value="${escapeHtml(parsedContext.lineStart || '')}" ${isDeepLinker ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label for="deep-end">Line End</label>
            <input type="number" id="deep-end" min="1" class="interactive-input" placeholder="End (e.g. 25)" value="${escapeHtml(parsedContext.lineEnd || '')}" ${isDeepLinker ? '' : 'disabled'}>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="deep-plain" class="interactive-checkbox" ${parsedContext.queryParams?.plain === '1' || parsedContext.isRaw ? 'checked' : ''} ${isDeepLinker ? '' : 'disabled'}>
              Format as Raw Text (<code>?plain=1</code>)
            </label>
          </div>
        </div>

        <div class="card-link-container interactive-output">
          <a href="${escapeHtml(initialDeepUrl || '#')}" target="_blank" rel="noopener noreferrer" class="card-link" id="deep-linker-url" title="${escapeHtml(initialDeepUrl || '')}">
            ${initialDeepUrl ? escapeHtml(initialDeepUrl.replace('https://', '')) : 'N/A'}
          </a>
          <button class="copy-btn" data-url="${escapeHtml(initialDeepUrl || '')}" aria-label="Copy Deep Linker link" ${initialDeepUrl ? '' : 'disabled'}>
            <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>

      <!-- Time Machine Compare Card -->
      <div class="card glass card-interactive ${isTimeMachine ? 'active' : 'disabled'}" data-card-id="time_machine">
        <div class="card-header">
          <div class="card-icon"><i data-lucide="history"></i></div>
          <div class="card-header-text">
            <h3 class="card-title">Time Machine Compare</h3>
            <span class="context-badge ${isTimeMachine ? 'active' : 'inactive'}">
              ${isTimeMachine ? escapeHtml(parsedContext.context) + ' Context' : 'Context Mismatch'}
            </span>
          </div>
        </div>
        <p class="card-description">Compare branches, tags, commit SHAs, or relative historical dates.</p>
        ${!isTimeMachine ? `<div class="context-notice">Time Machine Compare requires a <strong>Repo</strong> or <strong>File</strong> context URL (current: ${escapeHtml(parsedContext.context)}).</div>` : ''}

        <div class="interactive-controls">
          <div class="form-group">
            <label for="time-base-ref">Base Ref</label>
            <input type="text" id="time-base-ref" class="interactive-input" placeholder="Base ref (e.g. main)" value="${escapeHtml(parsedContext.ref || 'main')}" ${isTimeMachine ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label for="time-compare-mode">Compare Mode</label>
            <select id="time-compare-mode" class="interactive-select" ${isTimeMachine ? '' : 'disabled'}>
              <option value="ref" selected>Branch / Tag / SHA</option>
              <option value="timeframe">Relative Timeframe</option>
              <option value="custom_date">Custom Date</option>
            </select>
          </div>
          <div class="form-group" id="time-ref-group">
            <label for="time-compare-ref">Compare Ref</label>
            <input type="text" id="time-compare-ref" class="interactive-input" placeholder="Compare ref (e.g. dev, v1.0.0, SHA)" ${isTimeMachine ? '' : 'disabled'}>
          </div>
          <div class="form-group" id="time-timeframe-group" style="display: none;">
            <label for="time-timeframe">Timeframe</label>
            <select id="time-timeframe" class="interactive-select" ${isTimeMachine ? '' : 'disabled'}>
              <option value="1.week.ago" selected>1 week ago</option>
              <option value="1.month.ago">1 month ago</option>
              <option value="yesterday">Yesterday</option>
              <option value="1.year.ago">1 year ago</option>
            </select>
          </div>
          <div class="form-group" id="time-date-group" style="display: none;">
            <label for="time-custom-date">Custom Date</label>
            <input type="date" id="time-custom-date" class="interactive-input" ${isTimeMachine ? '' : 'disabled'}>
          </div>
          ${parsedContext.context === 'File' && parsedContext.filePath ? `
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="time-include-path" class="interactive-checkbox" checked ${isTimeMachine ? '' : 'disabled'}>
              Filter diff to file path (<code>${escapeHtml(parsedContext.filePath)}</code>)
            </label>
          </div>` : ''}
        </div>

        <div class="card-link-container interactive-output">
          <a href="${escapeHtml(initialTimeUrl || '#')}" target="_blank" rel="noopener noreferrer" class="card-link" id="time-machine-url" title="${escapeHtml(initialTimeUrl || '')}">
            ${initialTimeUrl ? escapeHtml(initialTimeUrl.replace('https://', '')) : 'N/A'}
          </a>
          <button class="copy-btn" data-url="${escapeHtml(initialTimeUrl || '')}" aria-label="Copy Time Machine link" ${initialTimeUrl ? '' : 'disabled'}>
            <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>

      <!-- Commit Feed Card -->
      <div class="card glass card-interactive ${isCommitFeed ? 'active' : 'disabled'}" data-card-id="commit_feed">
        <div class="card-header">
          <div class="card-icon"><i data-lucide="git-commit"></i></div>
          <div class="card-header-text">
            <h3 class="card-title">Commit Feed</h3>
            <span class="context-badge ${isCommitFeed ? 'active' : 'inactive'}">
              ${isCommitFeed ? escapeHtml(parsedContext.context) + ' Context' : 'Context Mismatch'}
            </span>
          </div>
        </div>
        <p class="card-description">Filter repository commit history by branch, author, and file path.</p>
        ${!isCommitFeed ? `<div class="context-notice">Commit Feed requires a <strong>Repo</strong> or <strong>File</strong> context URL (current: ${escapeHtml(parsedContext.context)}).</div>` : ''}

        <div class="interactive-controls">
          <div class="form-group">
            <label for="commit-ref">Branch / Ref</label>
            <input type="text" id="commit-ref" class="interactive-input" placeholder="Branch / Tag / SHA (e.g. main)" value="${escapeHtml(parsedContext.ref || '')}" ${isCommitFeed ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label for="commit-author">Author Filter</label>
            <input type="text" id="commit-author" class="interactive-input" placeholder="Author username/email (e.g. octocat)" value="${escapeHtml(parsedContext.queryParams?.author || '')}" ${isCommitFeed ? '' : 'disabled'}>
          </div>
          <div class="form-group">
            <label for="commit-path">Path Filter</label>
            <input type="text" id="commit-path" class="interactive-input" placeholder="File / folder path (e.g. src/index.js)" value="${escapeHtml(parsedContext.filePath || '')}" ${isCommitFeed ? '' : 'disabled'}>
          </div>
        </div>

        <div class="card-link-container interactive-output">
          <a href="${escapeHtml(initialCommitUrl || '#')}" target="_blank" rel="noopener noreferrer" class="card-link" id="commit-feed-url" title="${escapeHtml(initialCommitUrl || '')}">
            ${initialCommitUrl ? escapeHtml(initialCommitUrl.replace('https://', '')) : 'N/A'}
          </a>
          <button class="copy-btn" data-url="${escapeHtml(initialCommitUrl || '')}" aria-label="Copy Commit Feed link" ${initialCommitUrl ? '' : 'disabled'}>
            <i data-lucide="copy" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  containerEl.innerHTML = html;

  // Initialize Lucide icons if available
  if (typeof window !== 'undefined') {
    try {
      window.lucide?.createIcons?.();
    } catch {
      // Ignore icon init errors in headless/test environments
    }
  }

  // Live Updating Event Handlers
  if (isDeepLinker) {
    const deepStart = containerEl.querySelector('#deep-start');
    const deepEnd = containerEl.querySelector('#deep-end');
    const deepPlain = containerEl.querySelector('#deep-plain');
    const deepLink = containerEl.querySelector('#deep-linker-url');
    const deepBtn = deepLink?.parentElement?.querySelector('.copy-btn');

    const updateDeepLinker = () => {
      const url = buildDeepLinkerUrl(parsedContext, {
        lineStart: deepStart ? deepStart.value : undefined,
        lineEnd: deepEnd ? deepEnd.value : undefined,
        plainToggle: deepPlain ? deepPlain.checked : false
      });
      if (deepLink) {
        deepLink.href = url || '#';
        deepLink.textContent = url ? url.replace('https://', '') : 'N/A';
        deepLink.title = url || '';
      }
      if (deepBtn) {
        deepBtn.setAttribute('data-url', url || '');
        if (url) deepBtn.removeAttribute('disabled');
        else deepBtn.setAttribute('disabled', 'true');
      }
    };

    [deepStart, deepEnd, deepPlain].forEach(el => {
      if (el) {
        el.addEventListener('input', updateDeepLinker);
        el.addEventListener('change', updateDeepLinker);
      }
    });
  }

  if (isTimeMachine) {
    const baseRef = containerEl.querySelector('#time-base-ref');
    const compareMode = containerEl.querySelector('#time-compare-mode');
    const compareRef = containerEl.querySelector('#time-compare-ref');
    const timeframe = containerEl.querySelector('#time-timeframe');
    const customDate = containerEl.querySelector('#time-custom-date');
    const includePath = containerEl.querySelector('#time-include-path');

    const refGroup = containerEl.querySelector('#time-ref-group');
    const timeframeGroup = containerEl.querySelector('#time-timeframe-group');
    const dateGroup = containerEl.querySelector('#time-date-group');

    const timeLink = containerEl.querySelector('#time-machine-url');
    const timeBtn = timeLink?.parentElement?.querySelector('.copy-btn');

    const updateTimeMachine = () => {
      const mode = compareMode ? compareMode.value : 'ref';

      // Toggle group visibility
      if (refGroup) refGroup.style.display = mode === 'ref' ? '' : 'none';
      if (timeframeGroup) timeframeGroup.style.display = mode === 'timeframe' ? '' : 'none';
      if (dateGroup) dateGroup.style.display = mode === 'custom_date' ? '' : 'none';

      const url = buildTimeMachineUrl(parsedContext, {
        baseRef: baseRef ? baseRef.value : undefined,
        compareMode: mode,
        compareRef: compareRef ? compareRef.value : undefined,
        timeframe: timeframe ? timeframe.value : undefined,
        customDate: customDate ? customDate.value : undefined,
        includeFilePath: includePath ? includePath.checked : false
      });

      if (timeLink) {
        timeLink.href = url || '#';
        timeLink.textContent = url ? url.replace('https://', '') : 'N/A';
        timeLink.title = url || '';
      }
      if (timeBtn) {
        timeBtn.setAttribute('data-url', url || '');
        if (url) timeBtn.removeAttribute('disabled');
        else timeBtn.setAttribute('disabled', 'true');
      }
    };

    [baseRef, compareMode, compareRef, timeframe, customDate, includePath].forEach(el => {
      if (el) {
        el.addEventListener('input', updateTimeMachine);
        el.addEventListener('change', updateTimeMachine);
      }
    });
  }

  if (isCommitFeed) {
    const commitRef = containerEl.querySelector('#commit-ref');
    const commitAuthor = containerEl.querySelector('#commit-author');
    const commitPath = containerEl.querySelector('#commit-path');
    const commitLink = containerEl.querySelector('#commit-feed-url');
    const commitBtn = commitLink?.parentElement?.querySelector('.copy-btn');

    const updateCommitFeed = () => {
      const url = buildCommitFeedUrl(parsedContext, {
        refInput: commitRef ? commitRef.value : undefined,
        authorInput: commitAuthor ? commitAuthor.value : undefined,
        pathInput: commitPath ? commitPath.value : undefined
      });

      if (commitLink) {
        commitLink.href = url || '#';
        commitLink.textContent = url ? url.replace('https://', '') : 'N/A';
        commitLink.title = url || '';
      }
      if (commitBtn) {
        commitBtn.setAttribute('data-url', url || '');
        if (url) commitBtn.removeAttribute('disabled');
        else commitBtn.setAttribute('disabled', 'true');
      }
    };

    [commitRef, commitAuthor, commitPath].forEach(el => {
      if (el) {
        el.addEventListener('input', updateCommitFeed);
        el.addEventListener('change', updateCommitFeed);
      }
    });
  }

  // Copy button click listener for interactive cards
  const copyBtns = containerEl.querySelectorAll('.copy-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.currentTarget;
      const url = targetBtn.getAttribute('data-url');
      if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
    });
  });
}
