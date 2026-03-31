import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { readFileSync } from 'node:fs';
import Ajv, { type ValidateFunction } from 'ajv';
import { parse as parseYaml } from 'yaml';
import type { TaskDefinition } from '@snf/core';

// Schema loaded lazily on first validation to avoid path resolution issues
let taskSchema: Record<string, unknown> | null = null;
function getTaskSchema(registryDir?: string): Record<string, unknown> {
  if (!taskSchema) {
    const schemaPath = join(registryDir ?? __dirname, 'schemas', 'task-definition.schema.json');
    taskSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  }
  return taskSchema!;
}

/**
 * TaskRegistry — singleton registry that loads, validates, and indexes task definitions.
 *
 * Tasks are data, not code. Adding a new operational task = adding a YAML file.
 * The registry loads all YAML files from a directory tree, validates them against
 * the JSON Schema, and provides typed lookup by ID, agent, domain, and trigger type.
 */
export class TaskRegistry {
  private static instance: TaskRegistry | null = null;

  private tasks: Map<string, TaskDefinition> = new Map();
  private byAgent: Map<string, TaskDefinition[]> = new Map();
  private byDomain: Map<string, TaskDefinition[]> = new Map();
  private byTrigger: Map<string, TaskDefinition[]> = new Map();

  private validator: ValidateFunction;
  private loadedDir: string | null = null;

  private constructor() {
    const ajv = new Ajv({ allErrors: true, strict: false });
    this.validator = ajv.compile(getTaskSchema());
  }

  /** Get the singleton TaskRegistry instance. */
  static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }

  /** Reset the singleton (for testing). */
  static resetInstance(): void {
    TaskRegistry.instance = null;
  }

  /**
   * Recursively load all .yaml/.yml task definition files from a directory.
   * Validates each file against the JSON Schema and indexes by ID, agent, domain, trigger.
   */
  async loadFromDirectory(dir: string): Promise<TaskRegistryLoadResult> {
    this.loadedDir = dir;
    const errors: TaskRegistryError[] = [];
    const files = await this.collectYamlFiles(dir);

    // Clear existing state before loading
    this.tasks.clear();
    this.byAgent.clear();
    this.byDomain.clear();
    this.byTrigger.clear();

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const parsed = parseYaml(content);
        const validationResult = this.validate(parsed);

        if (!validationResult.valid) {
          errors.push({
            file: filePath,
            errors: validationResult.errors,
          });
          continue;
        }

        const task = parsed as TaskDefinition;

        if (this.tasks.has(task.id)) {
          errors.push({
            file: filePath,
            errors: [`Duplicate task ID: "${task.id}" already loaded`],
          });
          continue;
        }

        this.indexTask(task);
      } catch (err) {
        errors.push({
          file: filePath,
          errors: [`Parse error: ${err instanceof Error ? err.message : String(err)}`],
        });
      }
    }

    return {
      loaded: this.tasks.size,
      errors,
    };
  }

  /** Validate an unknown object against the task definition JSON Schema. */
  validate(task: unknown): TaskValidationResult {
    const valid = this.validator(task);
    if (valid) {
      return { valid: true, errors: [] };
    }
    const errors = (this.validator.errors ?? []).map(
      (e) => `${e.instancePath || '/'}: ${e.message}`,
    );
    return { valid: false, errors };
  }

  /** Get a task definition by ID. Returns undefined if not found. */
  get(taskId: string): TaskDefinition | undefined {
    return this.tasks.get(taskId);
  }

  /** Get all task definitions assigned to a specific agent. */
  getByAgent(agentId: string): TaskDefinition[] {
    return this.byAgent.get(agentId) ?? [];
  }

  /** Get all task definitions in a domain (clinical, financial, etc.). */
  getByDomain(domain: string): TaskDefinition[] {
    return this.byDomain.get(domain) ?? [];
  }

  /** Get all task definitions with a specific trigger type (schedule, event, manual, webhook). */
  getByTrigger(type: string): TaskDefinition[] {
    return this.byTrigger.get(type) ?? [];
  }

  /** Get all loaded task definitions. */
  getAll(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  /** Number of loaded task definitions. */
  get size(): number {
    return this.tasks.size;
  }

  /** Hot-reload task definitions from the last loaded directory. */
  async reload(): Promise<TaskRegistryLoadResult> {
    if (!this.loadedDir) {
      throw new Error('No directory loaded yet. Call loadFromDirectory() first.');
    }
    return this.loadFromDirectory(this.loadedDir);
  }

  // --- Private helpers ---

  private indexTask(task: TaskDefinition): void {
    this.tasks.set(task.id, task);

    // Index by agent
    const agentTasks = this.byAgent.get(task.agentId) ?? [];
    agentTasks.push(task);
    this.byAgent.set(task.agentId, agentTasks);

    // Index by domain
    const domainTasks = this.byDomain.get(task.domain) ?? [];
    domainTasks.push(task);
    this.byDomain.set(task.domain, domainTasks);

    // Index by trigger type
    const triggerTasks = this.byTrigger.get(task.trigger.type) ?? [];
    triggerTasks.push(task);
    this.byTrigger.set(task.trigger.type, triggerTasks);
  }

  /** Recursively collect all .yaml and .yml files from a directory. */
  private async collectYamlFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.collectYamlFiles(fullPath);
        results.push(...nested);
      } else {
        const ext = extname(entry.name).toLowerCase();
        if (ext === '.yaml' || ext === '.yml') {
          results.push(fullPath);
        }
      }
    }

    return results.sort();
  }
}

// --- Result types ---

export interface TaskRegistryLoadResult {
  loaded: number;
  errors: TaskRegistryError[];
}

export interface TaskRegistryError {
  file: string;
  errors: string[];
}

export interface TaskValidationResult {
  valid: boolean;
  errors: string[];
}
