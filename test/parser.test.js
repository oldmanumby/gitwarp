import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGithubUrl,
  isValidGithubUrl,
  extractRepoPath,
  normalizeGithubUrl,
} from '../src/parser.js';

describe('GitHub URL Parser', () => {
  describe('User Context', () => {
    it('parses standard user profile URL with https scheme', () => {
      const input = 'https://github.com/octocat';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'User');
      assert.equal(result.type, 'user');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, null);
      assert.equal(result.ref, null);
      assert.equal(result.filePath, null);
      assert.equal(result.path, null);
      assert.equal(result.commitSha, null);
      assert.equal(result.commitHash, null);
      assert.equal(result.prNumber, null);
      assert.equal(result.rawUrl, input);
      assert.equal(result.normalizedUrl, 'https://github.com/octocat');
    });

    it('parses scheme-less user profile URL with trailing slash', () => {
      const input = 'github.com/torvalds/';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'User');
      assert.equal(result.type, 'user');
      assert.equal(result.owner, 'torvalds');
      assert.equal(result.repo, null);
      assert.equal(result.normalizedUrl, 'https://github.com/torvalds');
    });
  });

  describe('Repo Context', () => {
    it('parses standard repository root URL', () => {
      const input = 'https://github.com/octocat/Spoon-Knife';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'Repo');
      assert.equal(result.type, 'repo');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, null);
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife');
    });

    it('strips .git extension from repository URLs', () => {
      const input = 'https://github.com/octocat/Spoon-Knife.git';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'Repo');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife');
    });

    it('parses repository branch root (/tree/main)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/tree/main';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'Repo');
      assert.equal(result.type, 'repo');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, null);
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife/tree/main');
    });
  });

  describe('File Context', () => {
    it('parses file blob URL', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/README.md';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.type, 'file');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'README.md');
      assert.equal(result.path, 'README.md');
      assert.equal(result.isRaw, false);
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/blob/main/README.md'
      );
    });

    it('parses line fragment ranges (#L10-L25)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/src/utils/math.js#L10-L25';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'src/utils/math.js');
      assert.equal(result.lineStart, 10);
      assert.equal(result.lineEnd, 25);
      assert.equal(result.rawUrl, input);
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/blob/main/src/utils/math.js'
      );
    });

    it('parses single line fragment (#L15)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/index.js#L15';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.lineStart, 15);
      assert.equal(result.lineEnd, 15);
    });

    it('parses query parameters (?plain=1)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/README.md?plain=1';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.deepEqual(result.queryParams, { plain: '1' });
    });

    it('parses raw.githubusercontent.com URLs', () => {
      const input = 'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/package.json';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.type, 'file');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'package.json');
      assert.equal(result.isRaw, true);
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/blob/main/package.json'
      );
    });

    it('parses directory tree views as File path context', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/tree/main/src/components';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'src/components');
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/tree/main/src/components'
      );
    });
  });

  describe('Commit Context', () => {
    it('parses full 40-character commit SHA URLs', () => {
      const input =
        'https://github.com/octocat/Spoon-Knife/commit/d6b777053b94a8c92a9b40742f1f58273614138e';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'Commit');
      assert.equal(result.type, 'commit');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'd6b777053b94a8c92a9b40742f1f58273614138e');
      assert.equal(result.commitSha, 'd6b777053b94a8c92a9b40742f1f58273614138e');
      assert.equal(result.commitHash, 'd6b777053b94a8c92a9b40742f1f58273614138e');
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/commit/d6b777053b94a8c92a9b40742f1f58273614138e'
      );
    });

    it('parses short commit SHA URLs with fragment anchors', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/commit/d6b777#diff-1234';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'Commit');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.commitSha, 'd6b777');
      assert.equal(result.commitHash, 'd6b777');
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife/commit/d6b777');
    });
  });

  describe('PR Context', () => {
    it('parses pull request URLs', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/pull/42';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'PR');
      assert.equal(result.type, 'pr');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.prNumber, '42');
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife/pull/42');
    });

    it('parses pull request sub-views with query parameters', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/pull/42/files?w=1';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'PR');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.prNumber, '42');
      assert.deepEqual(result.queryParams, { w: '1' });
      assert.equal(result.normalizedUrl, 'https://github.com/octocat/Spoon-Knife/pull/42');
    });
  });

  describe('Reserved Routes & Invalid URLs', () => {
    it('rejects reserved top-level routes (/settings)', () => {
      const result = parseGithubUrl('https://github.com/settings');
      assert.equal(result.valid, false);
      assert.equal(result.context, 'Unknown');
      assert.equal(result.normalizedUrl, null);
    });

    it('rejects reserved top-level routes (/explore)', () => {
      const result = parseGithubUrl('https://github.com/explore');
      assert.equal(result.valid, false);
      assert.equal(result.context, 'Unknown');
      assert.equal(result.normalizedUrl, null);
    });

    it('rejects external non-GitHub domains', () => {
      const result = parseGithubUrl('https://gitlab.com/octocat/Spoon-Knife');
      assert.equal(result.valid, false);
      assert.equal(result.context, 'Unknown');
      assert.equal(result.normalizedUrl, null);
    });

    it('handles empty strings, null, and non-string inputs gracefully', () => {
      assert.equal(parseGithubUrl('').valid, false);
      assert.equal(parseGithubUrl(null).valid, false);
      assert.equal(parseGithubUrl(undefined).valid, false);
      assert.equal(parseGithubUrl(12345).valid, false);
    });
  });

  describe('Immutability Check', () => {
    it('returns an Object.frozen context object', () => {
      const result = parseGithubUrl('https://github.com/octocat/Spoon-Knife');
      assert.ok(Object.isFrozen(result));
      assert.ok(Object.isFrozen(result.queryParams));

      assert.throws(() => {
        result.owner = 'hacker';
      }, TypeError);
    });
  });

  describe('Helper Functions', () => {
    it('isValidGithubUrl returns correct booleans', () => {
      assert.equal(isValidGithubUrl('https://github.com/octocat/Spoon-Knife'), true);
      assert.equal(isValidGithubUrl('https://github.com/settings'), false);
      assert.equal(isValidGithubUrl(''), false);
    });

    it('extractRepoPath returns owner/repo or null', () => {
      assert.equal(
        extractRepoPath('https://github.com/octocat/Spoon-Knife'),
        'octocat/Spoon-Knife'
      );
      assert.equal(
        extractRepoPath('https://github.com/octocat/Spoon-Knife/blob/main/README.md'),
        'octocat/Spoon-Knife'
      );
      assert.equal(extractRepoPath('https://github.com/octocat'), null);
      assert.equal(extractRepoPath('https://github.com/settings'), null);
    });

    it('normalizeGithubUrl returns normalized string or null', () => {
      assert.equal(
        normalizeGithubUrl('github.com/octocat/Spoon-Knife.git'),
        'https://github.com/octocat/Spoon-Knife'
      );
      assert.equal(
        normalizeGithubUrl(
          'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/package.json'
        ),
        'https://github.com/octocat/Spoon-Knife/blob/main/package.json'
      );
      assert.equal(normalizeGithubUrl('https://github.com/settings'), null);
    });
  });
});
