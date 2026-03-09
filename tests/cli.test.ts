import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const CLI_PATH = resolve(__dirname, '../dist/cli.js');
const TMP_DIR = resolve(__dirname, '../tmp-cli-test');

const API_USER_TS = `export interface ApiUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  is_active: boolean;
  [key: string]: unknown;
}
`;

const USER_TS = `export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
}
`;

function runCli(args: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });
    return { stdout, stderr: '', code: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      code: e.status ?? 1,
    };
  }
}

describe('CLI', () => {
  beforeAll(() => {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(resolve(TMP_DIR, 'ApiUser.ts'), API_USER_TS, 'utf-8');
    writeFileSync(resolve(TMP_DIR, 'User.ts'), USER_TS, 'utf-8');
  });

  afterAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  describe('help', () => {
    it('shows usage when called with --help', () => {
      const { stdout, code } = runCli('--help');
      expect(code).toBe(0);
      expect(stdout).toContain('npx @kylebrodeur/type-safe-mapping init');
      expect(stdout).toContain('--stdout');
      expect(stdout).toContain('--out');
    });

    it('shows usage when called with no arguments', () => {
      const { stdout, code } = runCli('');
      expect(code).toBe(0);
      expect(stdout).toContain('Usage:');
    });
  });

  describe('init command - stdout flag', () => {
    it('generates mapper code with source and target interfaces', () => {
      const { stdout, code } = runCli('init ApiUser.ts User.ts --stdout');
      expect(code).toBe(0);
      expect(stdout).toContain("import { MappedServiceBase, MappedType }");
      expect(stdout).toContain("from '@kylebrodeur/type-safe-mapping'");
      expect(stdout).toContain('ApiUser');
      expect(stdout).toContain('const fieldMapping =');
      expect(stdout).toContain('as const');
      expect(stdout).toContain('class ApiUserMapper extends MappedServiceBase');
    });

    it('auto-maps camelCase equivalents (first_name → firstName)', () => {
      const { stdout, code } = runCli('init ApiUser.ts User.ts --stdout');
      expect(code).toBe(0);
      expect(stdout).toContain("first_name: 'firstName'");
      expect(stdout).toContain("last_name: 'lastName'");
    });

    it('emits TODO comments for unresolved fields', () => {
      const { stdout, code } = runCli('init ApiUser.ts User.ts --stdout');
      expect(code).toBe(0);
      // user_id → id doesn't match by camelCase (would be userId), so it's a TODO
      expect(stdout).toContain('// TODO: user_id');
    });

    it('generates mapper from source only (no target file)', () => {
      const { stdout, code } = runCli('init ApiUser.ts --stdout');
      expect(code).toBe(0);
      expect(stdout).toContain('class ApiUserMapper');
      expect(stdout).toContain('MappedApiUser');
      // All fields are TODOs when no target is provided
      expect(stdout).toContain('// TODO: user_id');
      expect(stdout).toContain('// TODO: first_name');
    });

    it('uses target interface name as the exported type name', () => {
      const { stdout, code } = runCli('init ApiUser.ts User.ts --stdout');
      expect(code).toBe(0);
      expect(stdout).toContain('export type User =');
    });
  });

  describe('init command - file output', () => {
    const outputFile = resolve(TMP_DIR, 'ApiUserMapper.ts');

    beforeAll(() => {
      // Ensure clean state before this block runs
      if (existsSync(outputFile)) unlinkSync(outputFile);
    });

    afterAll(() => {
      if (existsSync(outputFile)) unlinkSync(outputFile);
    });

    it('writes mapper file next to source when no --out is given', () => {
      const { stdout, code } = runCli('init ApiUser.ts User.ts');
      expect(code).toBe(0);
      expect(stdout).toContain('✓ Generated mapper');
      expect(existsSync(outputFile)).toBe(true);
    });

    it('refuses to overwrite an existing output file', () => {
      // The file already exists from the previous test
      const { stderr, code } = runCli('init ApiUser.ts User.ts');
      expect(code).toBe(1);
      expect(stderr).toContain('already exists');
    });

    it('writes mapper to custom --out path', () => {
      const customOut = resolve(TMP_DIR, 'custom-mapper.ts');
      try {
        const { stdout, code } = runCli(`init ApiUser.ts User.ts --out ${customOut}`);
        expect(code).toBe(0);
        expect(stdout).toContain('✓ Generated mapper');
        expect(existsSync(customOut)).toBe(true);
      } finally {
        if (existsSync(customOut)) unlinkSync(customOut);
      }
    });
  });

  describe('error handling', () => {
    it('exits with error for unknown command', () => {
      const { stderr, code } = runCli('unknown');
      expect(code).toBe(1);
      expect(stderr).toContain('Unknown command');
    });

    it('exits with error when source file does not exist', () => {
      const { stderr, code } = runCli('init nonexistent.ts --stdout');
      expect(code).toBe(1);
      expect(stderr).toContain('not found');
    });

    it('exits with error when target file does not exist', () => {
      const { stderr, code } = runCli('init ApiUser.ts nonexistent.ts --stdout');
      expect(code).toBe(1);
      expect(stderr).toContain('not found');
    });

    it('exits with error when source has no interfaces', () => {
      const emptyFile = resolve(TMP_DIR, 'empty.ts');
      writeFileSync(emptyFile, 'const x = 1;\n', 'utf-8');
      try {
        const { stderr, code } = runCli('init empty.ts --stdout');
        expect(code).toBe(1);
        expect(stderr).toContain('No TypeScript interfaces found');
      } finally {
        unlinkSync(emptyFile);
      }
    });
  });
});
