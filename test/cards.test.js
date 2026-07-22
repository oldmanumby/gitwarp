import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_CARDS, isCardCompatible, getCardUrl, getCompatibleCards } from '../src/cards.js';
import { parseGithubUrl } from '../src/parser.js';

describe('Standard Trick Cards & Compatibility System', () => {
  describe('Catalog Completeness', () => {
    it('contains exactly 23 standard cards', () => {
      assert.equal(STANDARD_CARDS.length, 23);
    });

    it('has all required 11 existing and 12 new card IDs', () => {
      const expectedIds = [
        'boltnew',
        'deepwiki',
        'gitdiagram',
        'gitingest',
        'githubdev',
        'githubgg',
        'github1s',
        'gitmcp',
        'gitpodcast',
        'stackblitz',
        'starhistory',
        'keys',
        'gpg',
        'patch',
        'diff',
        'releases_atom',
        'commits_atom',
        'zip_archive',
        'codespaces_new',
        'gitpod_io',
        'vscode_dev',
        'ssh_clone',
        'raw_file',
      ];
      const actualIds = STANDARD_CARDS.map((c) => c.id);
      assert.deepEqual(actualIds.sort(), expectedIds.sort());
    });

    it('every card has valid metadata and generateUrl function', () => {
      for (const card of STANDARD_CARDS) {
        assert.ok(typeof card.id === 'string' && card.id.length > 0, `Card missing id: ${card.id}`);
        assert.ok(
          typeof card.name === 'string' && card.name.length > 0,
          `Card missing name: ${card.id}`
        );
        assert.ok(
          typeof card.icon === 'string' && card.icon.length > 0,
          `Card missing icon: ${card.id}`
        );
        assert.ok(
          Array.isArray(card.allowedContexts) && card.allowedContexts.length > 0,
          `Card missing allowedContexts: ${card.id}`
        );
        assert.ok(
          typeof card.description === 'string' && card.description.length > 0,
          `Card missing description: ${card.id}`
        );
        assert.ok(typeof card.generateUrl === 'function', `Card missing generateUrl: ${card.id}`);
      }
    });
  });

  describe('Compatibility Across Contexts', () => {
    describe('User Context (https://github.com/torvalds)', () => {
      const userCtx = parseGithubUrl('https://github.com/torvalds');

      it('parses valid User context', () => {
        assert.equal(userCtx.valid, true);
        assert.equal(userCtx.context, 'User');
        assert.equal(userCtx.owner, 'torvalds');
      });

      it('.keys and .gpg are compatible', () => {
        const keysCard = STANDARD_CARDS.find((c) => c.id === 'keys');
        const gpgCard = STANDARD_CARDS.find((c) => c.id === 'gpg');

        assert.equal(isCardCompatible(keysCard, userCtx), true);
        assert.equal(isCardCompatible(gpgCard, userCtx), true);
        assert.equal(getCardUrl(keysCard, userCtx), 'https://github.com/torvalds.keys');
        assert.equal(getCardUrl(gpgCard, userCtx), 'https://github.com/torvalds.gpg');
      });

      it('the other 21 repo/file/commit/PR cards are incompatible with User context', () => {
        const incompatibleCards = STANDARD_CARDS.filter((c) => c.id !== 'keys' && c.id !== 'gpg');
        assert.equal(incompatibleCards.length, 21);
        for (const card of incompatibleCards) {
          assert.equal(
            isCardCompatible(card, userCtx),
            false,
            `Card ${card.id} should be incompatible with User context`
          );
          assert.equal(
            getCardUrl(card, userCtx),
            null,
            `Card ${card.id} should return null URL for User context`
          );
        }
      });
    });

    describe('Repo Context (https://github.com/facebook/react)', () => {
      const repoCtx = parseGithubUrl('https://github.com/facebook/react');

      it('parses valid Repo context', () => {
        assert.equal(repoCtx.valid, true);
        assert.equal(repoCtx.context, 'Repo');
        assert.equal(repoCtx.owner, 'facebook');
        assert.equal(repoCtx.repo, 'react');
      });

      it('20 cards are compatible with Repo context', () => {
        const compatibleCards = getCompatibleCards(repoCtx);
        assert.equal(compatibleCards.length, 20);
      });

      it('.patch, .diff, and raw_file are incompatible with Repo context', () => {
        const patchCard = STANDARD_CARDS.find((c) => c.id === 'patch');
        const diffCard = STANDARD_CARDS.find((c) => c.id === 'diff');
        const rawFileCard = STANDARD_CARDS.find((c) => c.id === 'raw_file');

        assert.equal(isCardCompatible(patchCard, repoCtx), false);
        assert.equal(isCardCompatible(diffCard, repoCtx), false);
        assert.equal(isCardCompatible(rawFileCard, repoCtx), false);
        assert.equal(getCardUrl(patchCard, repoCtx), null);
        assert.equal(getCardUrl(diffCard, repoCtx), null);
        assert.equal(getCardUrl(rawFileCard, repoCtx), null);
      });
    });

    describe('File Context (https://github.com/facebook/react/blob/main/package.json)', () => {
      const fileCtx = parseGithubUrl('https://github.com/facebook/react/blob/main/package.json');

      it('parses valid File context', () => {
        assert.equal(fileCtx.valid, true);
        assert.equal(fileCtx.context, 'File');
        assert.equal(fileCtx.owner, 'facebook');
        assert.equal(fileCtx.repo, 'react');
        assert.equal(fileCtx.ref, 'main');
        assert.equal(fileCtx.filePath, 'package.json');
      });

      it('raw_file is compatible and generates correct raw URL', () => {
        const rawFileCard = STANDARD_CARDS.find((c) => c.id === 'raw_file');
        assert.equal(isCardCompatible(rawFileCard, fileCtx), true);
        assert.equal(
          getCardUrl(rawFileCard, fileCtx),
          'https://raw.githubusercontent.com/facebook/react/main/package.json'
        );
      });

      it('.patch and .diff are incompatible with File context', () => {
        const patchCard = STANDARD_CARDS.find((c) => c.id === 'patch');
        const diffCard = STANDARD_CARDS.find((c) => c.id === 'diff');
        assert.equal(isCardCompatible(patchCard, fileCtx), false);
        assert.equal(isCardCompatible(diffCard, fileCtx), false);
      });

      it('deep link aware cards generate deep file links', () => {
        const gitingest = STANDARD_CARDS.find((c) => c.id === 'gitingest');
        const githubdev = STANDARD_CARDS.find((c) => c.id === 'githubdev');
        const stackblitz = STANDARD_CARDS.find((c) => c.id === 'stackblitz');

        assert.equal(
          getCardUrl(gitingest, fileCtx),
          'https://gitingest.com/facebook/react/blob/main/package.json'
        );
        assert.equal(
          getCardUrl(githubdev, fileCtx),
          'https://github.dev/facebook/react/blob/main/package.json'
        );
        assert.equal(
          getCardUrl(stackblitz, fileCtx),
          'https://stackblitz.com/github/facebook/react?file=package.json'
        );
      });
    });

    describe('Commit Context (https://github.com/facebook/react/commit/a1b2c3d)', () => {
      const commitCtx = parseGithubUrl('https://github.com/facebook/react/commit/a1b2c3d');

      it('parses valid Commit context', () => {
        assert.equal(commitCtx.valid, true);
        assert.equal(commitCtx.context, 'Commit');
        assert.equal(commitCtx.owner, 'facebook');
        assert.equal(commitCtx.repo, 'react');
        assert.equal(commitCtx.commitSha, 'a1b2c3d');
      });

      it('.patch and .diff are compatible and generate commit patch/diff URLs', () => {
        const patchCard = STANDARD_CARDS.find((c) => c.id === 'patch');
        const diffCard = STANDARD_CARDS.find((c) => c.id === 'diff');

        assert.equal(isCardCompatible(patchCard, commitCtx), true);
        assert.equal(isCardCompatible(diffCard, commitCtx), true);
        assert.equal(
          getCardUrl(patchCard, commitCtx),
          'https://github.com/facebook/react/commit/a1b2c3d.patch'
        );
        assert.equal(
          getCardUrl(diffCard, commitCtx),
          'https://github.com/facebook/react/commit/a1b2c3d.diff'
        );
      });

      it('raw_file is incompatible with Commit context', () => {
        const rawFileCard = STANDARD_CARDS.find((c) => c.id === 'raw_file');
        assert.equal(isCardCompatible(rawFileCard, commitCtx), false);
        assert.equal(getCardUrl(rawFileCard, commitCtx), null);
      });

      it('deep link aware cards generate commit deep links', () => {
        const gitingest = STANDARD_CARDS.find((c) => c.id === 'gitingest');
        const githubdev = STANDARD_CARDS.find((c) => c.id === 'githubdev');
        const gitpod = STANDARD_CARDS.find((c) => c.id === 'gitpod_io');

        assert.equal(
          getCardUrl(gitingest, commitCtx),
          'https://gitingest.com/facebook/react/commit/a1b2c3d'
        );
        assert.equal(
          getCardUrl(githubdev, commitCtx),
          'https://github.dev/facebook/react/commit/a1b2c3d'
        );
        assert.equal(
          getCardUrl(gitpod, commitCtx),
          'https://gitpod.io/#https://github.com/facebook/react/commit/a1b2c3d'
        );
      });
    });

    describe('PR Context (https://github.com/facebook/react/pull/42)', () => {
      const prCtx = parseGithubUrl('https://github.com/facebook/react/pull/42');

      it('parses valid PR context', () => {
        assert.equal(prCtx.valid, true);
        assert.equal(prCtx.context, 'PR');
        assert.equal(prCtx.owner, 'facebook');
        assert.equal(prCtx.repo, 'react');
        assert.equal(prCtx.prNumber, '42');
      });

      it('.patch and .diff are compatible and generate PR patch/diff URLs', () => {
        const patchCard = STANDARD_CARDS.find((c) => c.id === 'patch');
        const diffCard = STANDARD_CARDS.find((c) => c.id === 'diff');

        assert.equal(isCardCompatible(patchCard, prCtx), true);
        assert.equal(isCardCompatible(diffCard, prCtx), true);
        assert.equal(
          getCardUrl(patchCard, prCtx),
          'https://github.com/facebook/react/pull/42.patch'
        );
        assert.equal(getCardUrl(diffCard, prCtx), 'https://github.com/facebook/react/pull/42.diff');
      });

      it('raw_file is incompatible with PR context', () => {
        const rawFileCard = STANDARD_CARDS.find((c) => c.id === 'raw_file');
        assert.equal(isCardCompatible(rawFileCard, prCtx), false);
        assert.equal(getCardUrl(rawFileCard, prCtx), null);
      });

      it('deep link aware cards generate PR deep links', () => {
        const gitingest = STANDARD_CARDS.find((c) => c.id === 'gitingest');
        const vscodeDev = STANDARD_CARDS.find((c) => c.id === 'vscode_dev');

        assert.equal(getCardUrl(gitingest, prCtx), 'https://gitingest.com/facebook/react/pull/42');
        assert.equal(
          getCardUrl(vscodeDev, prCtx),
          'https://vscode.dev/github/facebook/react/pull/42'
        );
      });
    });

    describe('Unknown / Invalid Context', () => {
      const unknownCtx = parseGithubUrl('invalid-url-here');

      it('returns isCardCompatible === false for all 23 cards', () => {
        assert.equal(unknownCtx.valid, false);
        assert.equal(unknownCtx.context, 'Unknown');

        for (const card of STANDARD_CARDS) {
          assert.equal(
            isCardCompatible(card, unknownCtx),
            false,
            `Card ${card.id} should be incompatible with Unknown context`
          );
          assert.equal(
            getCardUrl(card, unknownCtx),
            null,
            `Card ${card.id} should return null URL for Unknown context`
          );
        }
      });

      it('handles null/undefined context gracefully', () => {
        for (const card of STANDARD_CARDS) {
          assert.equal(isCardCompatible(card, null), false);
          assert.equal(getCardUrl(card, null), null);
          assert.equal(isCardCompatible(card, undefined), false);
          assert.equal(getCardUrl(card, undefined), null);
        }
      });
    });
  });

  describe('URL Generation Accuracy for All 23 Cards', () => {
    const repoCtx = parseGithubUrl('https://github.com/octocat/Hello-World');

    it('generates accurate URLs for repo context', () => {
      const expected = {
        boltnew: 'https://bolt.new/github.com/octocat/Hello-World',
        deepwiki: 'https://deepwiki.com/octocat/Hello-World',
        gitdiagram: 'https://gitdiagram.com/octocat/Hello-World',
        gitingest: 'https://gitingest.com/octocat/Hello-World',
        githubdev: 'https://github.dev/octocat/Hello-World',
        githubgg: 'https://github.gg/octocat/Hello-World',
        github1s: 'https://github1s.com/octocat/Hello-World',
        gitmcp: 'https://gitmcp.io/octocat/Hello-World',
        gitpodcast: 'https://gitpodcast.com/octocat/Hello-World',
        stackblitz: 'https://stackblitz.com/github/octocat/Hello-World',
        starhistory: 'https://star-history.com/#octocat/Hello-World&Date',
        keys: 'https://github.com/octocat.keys',
        gpg: 'https://github.com/octocat.gpg',
        releases_atom: 'https://github.com/octocat/Hello-World/releases.atom',
        commits_atom: 'https://github.com/octocat/Hello-World/commits.atom',
        zip_archive: 'https://github.com/octocat/Hello-World/archive/HEAD.zip',
        codespaces_new: 'https://codespaces.new/octocat/Hello-World',
        gitpod_io: 'https://gitpod.io/#https://github.com/octocat/Hello-World',
        vscode_dev: 'https://vscode.dev/github/octocat/Hello-World',
        ssh_clone: 'git@github.com:octocat/Hello-World.git',
      };

      for (const [id, expectedUrl] of Object.entries(expected)) {
        const card = STANDARD_CARDS.find((c) => c.id === id);
        assert.ok(card, `Card ${id} should exist`);
        assert.equal(getCardUrl(card, repoCtx), expectedUrl, `Url mismatch for card ${id}`);
      }
    });

    it('handles branch ref in commits.atom and zip_archive', () => {
      const branchCtx = parseGithubUrl('https://github.com/octocat/Hello-World/tree/dev');
      const commitsAtom = STANDARD_CARDS.find((c) => c.id === 'commits_atom');
      const zipArchive = STANDARD_CARDS.find((c) => c.id === 'zip_archive');

      assert.equal(
        getCardUrl(commitsAtom, branchCtx),
        'https://github.com/octocat/Hello-World/commits/dev.atom'
      );
      assert.equal(
        getCardUrl(zipArchive, branchCtx),
        'https://github.com/octocat/Hello-World/archive/refs/heads/dev.zip'
      );
    });
  });
});
