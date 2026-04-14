import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const DOCKER_DIR = resolve(__dirname, '..');

function readDockerfile(name: string): string {
  return readFileSync(resolve(DOCKER_DIR, name), 'utf-8');
}

function parseStages(content: string): string[] {
  return [...content.matchAll(/^FROM\s+\S+(?:\s+AS\s+(\S+))?/gm)].map(
    (m) => m[1] ?? 'unnamed',
  );
}

describe('Dockerfile (orchestrator)', () => {
  const content = readDockerfile('Dockerfile');

  it('has multi-stage build with builder and runtime stages', () => {
    const stages = parseStages(content);
    expect(stages).toContain('builder');
    expect(stages).toContain('runtime');
  });

  it('exposes port 3000', () => {
    expect(content).toMatch(/EXPOSE\s+3000/);
  });

  it('has a health check command', () => {
    expect(content).toMatch(/HEALTHCHECK/);
    expect(content).toMatch(/curl\s+-f\s+http:\/\/localhost:3000\/health/);
  });

  it('runs as non-root user', () => {
    expect(content).toMatch(/USER\s+snf/);
  });

  it('sets NODE_ENV to production', () => {
    expect(content).toMatch(/ENV\s+NODE_ENV[= ]production/);
  });
});

describe('Dockerfile.gateway', () => {
  const content = readDockerfile('Dockerfile.gateway');

  it('has multi-stage build with builder and runtime stages', () => {
    const stages = parseStages(content);
    expect(stages).toContain('builder');
    expect(stages).toContain('runtime');
  });

  it('exposes port 3001', () => {
    expect(content).toMatch(/EXPOSE\s+3001/);
  });

  it('has a health check command', () => {
    expect(content).toMatch(/HEALTHCHECK/);
    expect(content).toMatch(/curl\s+-f\s+http:\/\/localhost:3001\/health/);
  });

  it('runs as non-root user', () => {
    expect(content).toMatch(/USER\s+snf/);
  });

  it('sets NODE_ENV to production', () => {
    expect(content).toMatch(/ENV\s+NODE_ENV[= ]production/);
  });

  it('sets CONNECTOR_MODE to synthetic', () => {
    expect(content).toMatch(/ENV\s+CONNECTOR_MODE[= ]synthetic/);
  });
});
