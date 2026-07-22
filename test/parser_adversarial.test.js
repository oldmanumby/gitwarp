import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGithubUrl,
  isValidGithubUrl,
  extractRepoPath,
  normalizeGithubUrl,
} from '../src/parser.js';

describe('Adversarial & Stress Tests for src/parser.js', () => {
  describe('1. Extremely Long Inputs', () => {
    it('handles 10,000+ char path without crashing or freezing', () => {
      const longPath = 'a/'.repeat(5000) + 'file.js';
      const input = `https://github.com/octocat/Spoon-Knife/blob/main/${longPath}`;
      const start = performance.now();
      const result = parseGithubUrl(input);
      const duration = performance.now() - start;

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, longPath);
      assert.ok(duration < 1000, `Execution took ${duration}ms`);
      assert.ok(Object.isFrozen(result));
      assert.ok(Object.isFrozen(result.queryParams));
    });

    it('handles 10,000+ char query parameter', () => {
      const longQuery = 'key=' + 'v'.repeat(15000);
      const input = `https://github.com/octocat/Spoon-Knife/blob/main/README.md?${longQuery}`;
      const start = performance.now();
      const result = parseGithubUrl(input);
      const duration = performance.now() - start;

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.ok(duration < 1000, `Execution took ${duration}ms`);
      assert.ok(Object.isFrozen(result));
      assert.ok(Object.isFrozen(result.queryParams));
    });

    it('handles 10,000+ char line hash fragment (evaluates to null on parseInt overflow)', () => {
      const longHash = '#L' + '1'.repeat(15000);
      const input = `https://github.com/octocat/Spoon-Knife/blob/main/README.md${longHash}`;
      const start = performance.now();
      const result = parseGithubUrl(input);
      const duration = performance.now() - start;

      assert.equal(result.valid, true);
      assert.equal(result.lineStart, null);
      assert.equal(result.lineEnd, null);
      assert.ok(duration < 1000, `Execution took ${duration}ms`);
      assert.ok(Object.isFrozen(result));
    });

    it('handles 100,000+ char input string gracefully', () => {
      const hugeInput = 'https://github.com/' + 'x'.repeat(100000);
      const start = performance.now();
      const result = parseGithubUrl(hugeInput);
      const duration = performance.now() - start;

      assert.ok(duration < 1000, `Execution took ${duration}ms`);
      assert.ok(Object.isFrozen(result));
    });
  });

  describe('2. Malicious URLs & Control Characters', () => {
    it('handles null bytes (%00) safely', () => {
      const inputs = [
        'https://github.com/%00/repo',
        'https://github.com/owner/%00repo',
        'https://github.com/owner/repo/blob/main/file%00.js',
        'https://github.com/owner\0/repo',
      ];

      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.ok(Object.isFrozen(result));
        assert.ok(typeof result.valid === 'boolean');
      }
    });

    it('handles newline (%0A) and carriage return (%0D) control characters', () => {
      const inputs = [
        'https://github.com/owner\n/repo',
        'https://github.com/owner%0A/repo',
        'https://github.com/owner/repo%0D%0A/blob/main/file.js',
      ];

      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.ok(Object.isFrozen(result));
        assert.ok(typeof result.valid === 'boolean');
      }
    });

    it('handles path traversal attempts (%2E%2E, ../)', () => {
      const inputs = [
        'https://github.com/owner/repo/../../etc/passwd',
        'https://github.com/owner/repo/blob/main/%2E%2E/%2E%2E/etc/passwd',
        'https://github.com/owner/repo/blob/main/..%2f..%2fetc/passwd',
      ];

      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.ok(Object.isFrozen(result));
        assert.ok(typeof result.valid === 'boolean');
      }
    });

    it('handles malformed percent encodings', () => {
      const inputs = [
        'https://github.com/owner/repo/blob/main/%',
        'https://github.com/owner/repo/blob/main/%Z',
        'https://github.com/owner/repo/blob/main/%E0%A0%80',
      ];

      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.ok(Object.isFrozen(result));
        assert.ok(typeof result.valid === 'boolean');
      }
    });
  });

  describe('3. Complex Nested Paths', () => {
    it('parses deep nested file paths (blob/main/a/b/c/d/e/f/g/h/i.js)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/a/b/c/d/e/f/g/h/i.js';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'a/b/c/d/e/f/g/h/i.js');
      assert.equal(
        result.normalizedUrl,
        'https://github.com/octocat/Spoon-Knife/blob/main/a/b/c/d/e/f/g/h/i.js'
      );
      assert.ok(Object.isFrozen(result));
    });

    it('handles multiple consecutive slashes gracefully', () => {
      const input = 'https://github.com///octocat///Spoon-Knife///blob///main///src///index.js';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'octocat');
      assert.equal(result.repo, 'Spoon-Knife');
      assert.equal(result.ref, 'main');
      assert.equal(result.filePath, 'src/index.js');
      assert.ok(Object.isFrozen(result));
    });

    it('handles dot-separated segments in filenames and directories', () => {
      const input =
        'https://github.com/owner.name/repo.name/blob/v1.0.0/dir.with.dots/file.spec.js';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.context, 'File');
      assert.equal(result.owner, 'owner.name');
      assert.equal(result.repo, 'repo.name');
      assert.equal(result.ref, 'v1.0.0');
      assert.equal(result.filePath, 'dir.with.dots/file.spec.js');
      assert.ok(Object.isFrozen(result));
    });
  });

  describe('4. Peculiar Line Fragments', () => {
    it('parses large range line fragments (#L1-L999999)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/index.js#L1-L999999';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.lineStart, 1);
      assert.equal(result.lineEnd, 999999);
      assert.ok(Object.isFrozen(result));
    });

    it('handles non-numeric line fragments (#Labc)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/index.js#Labc';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.lineStart, null);
      assert.equal(result.lineEnd, null);
      assert.ok(Object.isFrozen(result));
    });

    it('parses column-qualified line fragments (#L10C5-L20C15)', () => {
      const input = 'https://github.com/octocat/Spoon-Knife/blob/main/index.js#L10C5-L20C15';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(result.lineStart, 10);
      assert.equal(result.lineEnd, 20);
      assert.ok(Object.isFrozen(result));
    });

    it('handles integer overflow line fragments (#L9999999999999999999999)', () => {
      const input =
        'https://github.com/octocat/Spoon-Knife/blob/main/index.js#L9999999999999999999999';
      const result = parseGithubUrl(input);

      assert.equal(result.valid, true);
      assert.equal(typeof result.lineStart, 'number');
      assert.ok(Object.isFrozen(result));
    });

    it('handles non-standard hashes (#L10#L20, #readme, #diff-1234)', () => {
      const hashes = ['#readme', '#diff-1234', '#L10#L20', '#L', '#L-L', '#L1-'];
      for (const h of hashes) {
        const input = `https://github.com/octocat/Spoon-Knife/blob/main/index.js${h}`;
        const result = parseGithubUrl(input);
        assert.equal(result.valid, true);
        assert.ok(Object.isFrozen(result));
      }
    });
  });

  describe('5. Hostnames, IP Addresses, and Localhost', () => {
    it('rejects localhost URLs', () => {
      const inputs = [
        'http://localhost/octocat/Spoon-Knife',
        'https://localhost:8080/octocat/Spoon-Knife',
        'localhost/octocat/Spoon-Knife',
      ];
      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.equal(result.valid, false);
        assert.equal(result.context, 'Unknown');
        assert.ok(Object.isFrozen(result));
      }
    });

    it('rejects IP address URLs', () => {
      const inputs = [
        'http://127.0.0.1/octocat/Spoon-Knife',
        'https://192.168.1.1/octocat/Spoon-Knife',
        'http://[::1]/octocat/Spoon-Knife',
      ];
      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.equal(result.valid, false);
        assert.equal(result.context, 'Unknown');
        assert.ok(Object.isFrozen(result));
      }
    });

    it('rejects unregistered hostnames and fake GitHub domains', () => {
      const inputs = [
        'https://github.fake.com/octocat/Spoon-Knife',
        'https://notgithub.com/octocat/Spoon-Knife',
        'https://github.com.attacker.com/octocat/Spoon-Knife',
        'https://evilgithub.com/octocat/Spoon-Knife',
        'https://sub.raw.githubusercontent.com/octocat/Spoon-Knife/main/file.js',
      ];
      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.equal(result.valid, false);
        assert.equal(result.context, 'Unknown');
        assert.ok(Object.isFrozen(result));
      }
    });

    it('accepts valid GitHub hostnames with mixed case (GITHUB.COM, Raw.GitHubUserContent.COM)', () => {
      const inputs = [
        'HTTPS://GITHUB.COM/octocat/Spoon-Knife',
        'https://Raw.GitHubUserContent.COM/octocat/Spoon-Knife/main/package.json',
        'https://GITHUB.DEV/octocat/Spoon-Knife',
        'https://GITHUB1S.COM/octocat/Spoon-Knife',
      ];
      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.equal(result.valid, true);
        assert.ok(Object.isFrozen(result));
      }
    });
  });

  describe('6. Uncaught Exception Safety & Immutability', () => {
    it('handles standard non-string and falsy primitive inputs safely', () => {
      const testInputs = [
        null,
        undefined,
        '',
        '   ',
        12345,
        0,
        -1,
        NaN,
        Infinity,
        true,
        false,
        Symbol('test'),
        BigInt(100),
        {},
        [],
        { foo: 'bar' },
        new Date(),
        /test-regex/,
        () => {},
      ];

      for (const input of testInputs) {
        assert.doesNotThrow(() => {
          const result = parseGithubUrl(input);
          assert.ok(typeof result === 'object' && result !== null);
          assert.ok(Object.isFrozen(result));
          assert.ok(Object.isFrozen(result.queryParams));
        });

        assert.doesNotThrow(() => {
          isValidGithubUrl(input);
        });

        assert.doesNotThrow(() => {
          extractRepoPath(input);
        });

        assert.doesNotThrow(() => {
          normalizeGithubUrl(input);
        });
      }
    });

    it('handles Object.create(null) safely without throwing uncaught TypeError', () => {
      const nullProtoObj = Object.create(null);
      assert.doesNotThrow(() => {
        const result = parseGithubUrl(nullProtoObj);
        assert.equal(result.valid, false);
        assert.equal(result.context, 'Unknown');
      });
    });

    it('handles throwing custom toString() safely without throwing uncaught Error', () => {
      const throwingObj = {
        toString() {
          throw new Error('Uncaught toString error');
        },
      };
      assert.doesNotThrow(() => {
        const result = parseGithubUrl(throwingObj);
        assert.equal(result.valid, false);
        assert.equal(result.context, 'Unknown');
      });
    });

    it('always returns frozen objects that prevent mutation on all valid outputs', () => {
      const inputs = ['https://github.com/octocat/Spoon-Knife', 'https://invalid-url.com/foo', ''];

      for (const input of inputs) {
        const result = parseGithubUrl(input);
        assert.ok(Object.isFrozen(result), 'Result object must be frozen');
        assert.ok(Object.isFrozen(result.queryParams), 'queryParams object must be frozen');

        assert.throws(() => {
          result.valid = !result.valid;
        }, TypeError);

        assert.throws(() => {
          result.newProp = 'hack';
        }, TypeError);

        assert.throws(() => {
          delete result.context;
        }, TypeError);

        assert.throws(() => {
          result.queryParams.newKey = 'val';
        }, TypeError);
      }
    });
  });
});
