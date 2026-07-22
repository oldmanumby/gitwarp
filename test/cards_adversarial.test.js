import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_CARDS, isCardCompatible, getCardUrl, getCompatibleCards } from '../src/cards.js';

describe('Adversarial & Stress Tests for src/cards.js', () => {
  describe('1. Malformed Parsed Contexts', () => {
    it('returns false/null for null and undefined context', () => {
      for (const card of STANDARD_CARDS) {
        assert.equal(isCardCompatible(card, null), false);
        assert.equal(isCardCompatible(card, undefined), false);
        assert.equal(getCardUrl(card, null), null);
        assert.equal(getCardUrl(card, undefined), null);
      }
      assert.deepEqual(getCompatibleCards(null), []);
      assert.deepEqual(getCompatibleCards(undefined), []);
    });

    it('returns false/null for primitive context inputs', () => {
      const primitives = [false, true, 0, 42, -1, '', 'invalid string', Symbol('ctx'), 100n];
      for (const prim of primitives) {
        for (const card of STANDARD_CARDS) {
          assert.equal(isCardCompatible(card, prim), false);
          assert.equal(getCardUrl(card, prim), null);
        }
        assert.deepEqual(getCompatibleCards(prim), []);
      }
    });

    it('returns false/null when valid flag is false', () => {
      const invalidContext = {
        valid: false,
        context: 'Repo',
        owner: 'facebook',
        repo: 'react',
      };
      for (const card of STANDARD_CARDS) {
        assert.equal(isCardCompatible(card, invalidContext), false);
        assert.equal(getCardUrl(card, invalidContext), null);
      }
      assert.deepEqual(getCompatibleCards(invalidContext), []);
    });

    it('returns false/null when context is Unknown', () => {
      const unknownContext = {
        valid: true,
        context: 'Unknown',
        owner: 'facebook',
        repo: 'react',
      };
      for (const card of STANDARD_CARDS) {
        assert.equal(isCardCompatible(card, unknownContext), false);
        assert.equal(getCardUrl(card, unknownContext), null);
      }
      assert.deepEqual(getCompatibleCards(unknownContext), []);
    });

    it('returns false/null when context is an unrecognised type', () => {
      const bogusContextTypes = [
        'Organization',
        'Gist',
        'Discussion',
        'Project',
        'Wiki',
        'Issue',
        '',
      ];
      for (const ctxType of bogusContextTypes) {
        const ctx = { valid: true, context: ctxType, owner: 'owner', repo: 'repo' };
        for (const card of STANDARD_CARDS) {
          assert.equal(isCardCompatible(card, ctx), false);
          assert.equal(getCardUrl(card, ctx), null);
        }
        assert.deepEqual(getCompatibleCards(ctx), []);
      }
    });

    it('handles context missing required identifiers (null owner/repo/filePath)', () => {
      const missingOwner = { valid: true, context: 'Repo', owner: null, repo: 'react' };
      const missingRepo = { valid: true, context: 'Repo', owner: 'facebook', repo: null };
      const missingFile = {
        valid: true,
        context: 'File',
        owner: 'facebook',
        repo: 'react',
        filePath: null,
      };
      const missingSha = {
        valid: true,
        context: 'Commit',
        owner: 'facebook',
        repo: 'react',
        commitSha: null,
      };
      const missingPR = {
        valid: true,
        context: 'PR',
        owner: 'facebook',
        repo: 'react',
        prNumber: null,
      };

      for (const card of STANDARD_CARDS) {
        if (card.id === 'keys' || card.id === 'gpg') continue; // keys and gpg only need owner
        assert.equal(
          isCardCompatible(card, missingOwner),
          false,
          `Card ${card.id} should be incompatible with missing owner`
        );
        assert.equal(getCardUrl(card, missingOwner), null);
      }

      for (const card of STANDARD_CARDS) {
        if (card.id === 'keys' || card.id === 'gpg') continue;
        assert.equal(
          isCardCompatible(card, missingRepo),
          false,
          `Card ${card.id} should be incompatible with missing repo`
        );
        assert.equal(getCardUrl(card, missingRepo), null);
      }

      const rawFileCard = STANDARD_CARDS.find((c) => c.id === 'raw_file');
      assert.equal(isCardCompatible(rawFileCard, missingFile), false);
      assert.equal(getCardUrl(rawFileCard, missingFile), null);

      const patchCard = STANDARD_CARDS.find((c) => c.id === 'patch');
      const diffCard = STANDARD_CARDS.find((c) => c.id === 'diff');
      assert.equal(isCardCompatible(patchCard, missingSha), false);
      assert.equal(getCardUrl(patchCard, missingSha), null);
      assert.equal(isCardCompatible(diffCard, missingPR), false);
      assert.equal(getCardUrl(diffCard, missingPR), null);
    });

    it('handles invalid valid flag types (non-boolean truthy/falsy values)', () => {
      const nonBoolValid = { valid: 'true', context: 'User', owner: 'torvalds' }; // string 'true' is truthy
      const numBoolValid = { valid: 1, context: 'User', owner: 'torvalds' }; // 1 is truthy
      const zeroValid = { valid: 0, context: 'User', owner: 'torvalds' }; // 0 is falsy

      const keysCard = STANDARD_CARDS.find((c) => c.id === 'keys');
      assert.equal(isCardCompatible(keysCard, nonBoolValid), true);
      assert.equal(isCardCompatible(keysCard, numBoolValid), true);
      assert.equal(isCardCompatible(keysCard, zeroValid), false);
    });
  });

  describe('2. Null, Undefined, and Malformed Card Objects', () => {
    const validCtx = { valid: true, context: 'Repo', owner: 'facebook', repo: 'react' };

    it('returns false/null for null and undefined card objects', () => {
      assert.equal(isCardCompatible(null, validCtx), false);
      assert.equal(isCardCompatible(undefined, validCtx), false);
      assert.equal(getCardUrl(null, validCtx), null);
      assert.equal(getCardUrl(undefined, validCtx), null);
    });

    it('returns false/null for non-object card representations', () => {
      const invalidCards = [false, true, 0, 123, 'card_id', Symbol('card'), () => {}];
      for (const badCard of invalidCards) {
        assert.equal(isCardCompatible(badCard, validCtx), false);
        assert.equal(getCardUrl(badCard, validCtx), null);
      }
    });

    it('returns false/null when card allowedContexts is missing, invalid type, or empty', () => {
      const missingAllowed = { id: 'test', generateUrl: () => 'https://example.com' };
      const nonArrayAllowed = {
        id: 'test',
        allowedContexts: 'Repo',
        generateUrl: () => 'https://example.com',
      };
      const emptyAllowed = {
        id: 'test',
        allowedContexts: [],
        generateUrl: () => 'https://example.com',
      };
      const nullAllowed = {
        id: 'test',
        allowedContexts: null,
        generateUrl: () => 'https://example.com',
      };

      assert.equal(isCardCompatible(missingAllowed, validCtx), false);
      assert.equal(isCardCompatible(nonArrayAllowed, validCtx), false);
      assert.equal(isCardCompatible(emptyAllowed, validCtx), false);
      assert.equal(isCardCompatible(nullAllowed, validCtx), false);

      assert.equal(getCardUrl(missingAllowed, validCtx), null);
      assert.equal(getCardUrl(nonArrayAllowed, validCtx), null);
      assert.equal(getCardUrl(emptyAllowed, validCtx), null);
      assert.equal(getCardUrl(nullAllowed, validCtx), null);
    });

    it('returns false/null when card generateUrl throws an exception', () => {
      const throwingCard = {
        id: 'throwing',
        allowedContexts: ['Repo'],
        generateUrl: () => {
          throw new Error('Uncaught error inside generator');
        },
      };
      const primitiveThrowingCard = {
        id: 'prim_throwing',
        allowedContexts: ['Repo'],
        generateUrl: () => {
          throw 'String exception';
        },
      };

      assert.doesNotThrow(() => {
        assert.equal(isCardCompatible(throwingCard, validCtx), false);
        assert.equal(getCardUrl(throwingCard, validCtx), null);
        assert.equal(isCardCompatible(primitiveThrowingCard, validCtx), false);
        assert.equal(getCardUrl(primitiveThrowingCard, validCtx), null);
      });
    });

    it('returns false/null when card generateUrl returns non-string or empty string', () => {
      const returnsNumber = { id: 'num', allowedContexts: ['Repo'], generateUrl: () => 12345 };
      const returnsObj = {
        id: 'obj',
        allowedContexts: ['Repo'],
        generateUrl: () => ({ url: 'https://example.com' }),
      };
      const returnsEmpty = { id: 'empty', allowedContexts: ['Repo'], generateUrl: () => '' };
      const returnsNull = { id: 'null', allowedContexts: ['Repo'], generateUrl: () => null };

      assert.equal(isCardCompatible(returnsNumber, validCtx), false);
      assert.equal(getCardUrl(returnsNumber, validCtx), null);

      assert.equal(isCardCompatible(returnsObj, validCtx), false);
      assert.equal(getCardUrl(returnsObj, validCtx), null);

      assert.equal(isCardCompatible(returnsEmpty, validCtx), false);
      assert.equal(getCardUrl(returnsEmpty, validCtx), null);

      assert.equal(isCardCompatible(returnsNull, validCtx), false);
      assert.equal(getCardUrl(returnsNull, validCtx), null);
    });

    it('returns false/null when generateUrl is missing or not a function', () => {
      const missingGen = { id: 'no_gen', allowedContexts: ['Repo'] };
      const stringGen = {
        id: 'str_gen',
        allowedContexts: ['Repo'],
        generateUrl: 'https://example.com',
      };

      assert.equal(isCardCompatible(missingGen, validCtx), false);
      assert.equal(getCardUrl(missingGen, validCtx), null);
      assert.equal(isCardCompatible(stringGen, validCtx), false);
      assert.equal(getCardUrl(stringGen, validCtx), null);
    });
  });

  describe('3. Unexpected Extra Properties & Prototype Safety', () => {
    it('handles context created with Object.create(null)', () => {
      const nullProtoCtx = Object.create(null);
      nullProtoCtx.valid = true;
      nullProtoCtx.context = 'Repo';
      nullProtoCtx.owner = 'facebook';
      nullProtoCtx.repo = 'react';

      assert.doesNotThrow(() => {
        const compatible = getCompatibleCards(nullProtoCtx);
        assert.equal(compatible.length, 20);
        const boltCard = STANDARD_CARDS.find((c) => c.id === 'boltnew');
        assert.equal(isCardCompatible(boltCard, nullProtoCtx), true);
        assert.equal(
          getCardUrl(boltCard, nullProtoCtx),
          'https://bolt.new/github.com/facebook/react'
        );
      });
    });

    it('handles context with throwing property getters gracefully', () => {
      const throwingOwnerCtx = {
        valid: true,
        context: 'Repo',
        get owner() {
          throw new Error('Owner getter execution failed');
        },
        repo: 'react',
      };

      for (const card of STANDARD_CARDS) {
        assert.doesNotThrow(() => {
          assert.equal(isCardCompatible(card, throwingOwnerCtx), false);
          assert.equal(getCardUrl(card, throwingOwnerCtx), null);
        });
      }

      const throwingRepoCtx = {
        valid: true,
        context: 'Repo',
        owner: 'facebook',
        get repo() {
          throw new Error('Repo getter execution failed');
        },
      };

      const boltCard = STANDARD_CARDS.find((c) => c.id === 'boltnew');
      const keysCard = STANDARD_CARDS.find((c) => c.id === 'keys');

      assert.doesNotThrow(() => {
        // repo-dependent card catches error and returns false
        assert.equal(isCardCompatible(boltCard, throwingRepoCtx), false);
        assert.equal(getCardUrl(boltCard, throwingRepoCtx), null);

        // owner-only card does not touch repo property, succeeds safely
        assert.equal(isCardCompatible(keysCard, throwingRepoCtx), true);
        assert.equal(getCardUrl(keysCard, throwingRepoCtx), 'https://github.com/facebook.keys');
      });
    });

    it('handles context with extra malicious or unusual properties', () => {
      const clutteredCtx = {
        valid: true,
        context: 'Repo',
        owner: 'facebook',
        repo: 'react',
        extraPayload: '<script>alert(1)</script>',
        __proto__: { injected: true },
        toString: () => {
          throw new Error('toString exploded');
        },
        valueOf: null,
        [Symbol('custom')]: 'symbol_value',
      };

      const boltCard = STANDARD_CARDS.find((c) => c.id === 'boltnew');
      assert.equal(isCardCompatible(boltCard, clutteredCtx), true);
      assert.equal(
        getCardUrl(boltCard, clutteredCtx),
        'https://bolt.new/github.com/facebook/react'
      );
    });

    it('remains resilient under Object.prototype pollution', () => {
      // Temporarily pollute Object.prototype
      Object.prototype.pollutedProperty = 'MALICIOUS';
      Object.prototype.valid = true;
      Object.prototype.context = 'User';
      Object.prototype.owner = 'injectedOwner';

      try {
        const emptyObj = {};
        // Empty object inherits valid: true, context: 'User', owner: 'injectedOwner'
        const keysCard = STANDARD_CARDS.find((c) => c.id === 'keys');
        assert.doesNotThrow(() => {
          const compatible = isCardCompatible(keysCard, emptyObj);
          // emptyObj inherits valid=true, context='User', owner='injectedOwner' from Object.prototype
          // standard behavior in JS: inherits properties unless hasOwnProperty is enforced.
          // Verify no crash occurs regardless.
          const url = getCardUrl(keysCard, emptyObj);
          assert.ok(typeof url === 'string' || url === null);
        });
      } finally {
        delete Object.prototype.pollutedProperty;
        delete Object.prototype.valid;
        delete Object.prototype.context;
        delete Object.prototype.owner;
      }
    });
  });

  describe('4. Exhaustive Matrix of All 23 Standard Cards', () => {
    const sampleContexts = [
      {
        id: 'user',
        valid: true,
        context: 'User',
        owner: 'torvalds',
        repo: null,
        ref: null,
        filePath: null,
        commitSha: null,
        prNumber: null,
      },
      {
        id: 'repo',
        valid: true,
        context: 'Repo',
        owner: 'facebook',
        repo: 'react',
        ref: 'main',
        filePath: null,
        commitSha: null,
        prNumber: null,
      },
      {
        id: 'file',
        valid: true,
        context: 'File',
        owner: 'facebook',
        repo: 'react',
        ref: 'v18.2.0',
        filePath: 'package.json',
        commitSha: null,
        prNumber: null,
      },
      {
        id: 'commit',
        valid: true,
        context: 'Commit',
        owner: 'facebook',
        repo: 'react',
        ref: null,
        filePath: null,
        commitSha: 'a1b2c3d4e5f6',
        prNumber: null,
      },
      {
        id: 'pr',
        valid: true,
        context: 'PR',
        owner: 'facebook',
        repo: 'react',
        ref: null,
        filePath: null,
        commitSha: null,
        prNumber: '1234',
      },
      {
        id: 'invalid',
        valid: false,
        context: 'Unknown',
        owner: null,
        repo: null,
        ref: null,
        filePath: null,
        commitSha: null,
        prNumber: null,
      },
    ];

    it('never throws uncaught exception for any card x context combination', () => {
      for (const card of STANDARD_CARDS) {
        for (const ctx of sampleContexts) {
          assert.doesNotThrow(() => {
            const isComp = isCardCompatible(card, ctx);
            const url = getCardUrl(card, ctx);

            assert.equal(typeof isComp, 'boolean');
            if (isComp) {
              assert.ok(typeof url === 'string' && url.length > 0);
            } else {
              assert.equal(url, null);
            }
          }, `Failed on card=${card.id}, context=${ctx.id}`);
        }
      }
    });
  });

  describe('5. Immutability and Side-Effect Safety', () => {
    it('does not mutate STANDARD_CARDS array or cards when evaluating compatibility', () => {
      const initialCardsCount = STANDARD_CARDS.length;
      const initialJson = JSON.stringify(
        STANDARD_CARDS.map((c) => ({ id: c.id, allowedContexts: c.allowedContexts }))
      );

      const repoCtx = { valid: true, context: 'Repo', owner: 'facebook', repo: 'react' };
      getCompatibleCards(repoCtx);
      for (const card of STANDARD_CARDS) {
        isCardCompatible(card, repoCtx);
        getCardUrl(card, repoCtx);
      }

      assert.equal(STANDARD_CARDS.length, initialCardsCount);
      const afterJson = JSON.stringify(
        STANDARD_CARDS.map((c) => ({ id: c.id, allowedContexts: c.allowedContexts }))
      );
      assert.equal(initialJson, afterJson);
    });

    it('works safely with frozen context objects', () => {
      const frozenCtx = Object.freeze({
        valid: true,
        context: 'File',
        owner: 'facebook',
        repo: 'react',
        ref: 'main',
        filePath: 'README.md',
      });

      assert.doesNotThrow(() => {
        const compatibleCards = getCompatibleCards(frozenCtx);
        assert.ok(compatibleCards.length > 0);
      });
    });
  });
});
