import { describe, expect, it } from 'vitest';
import { parseProjectsUploadText } from './useProjectImport';

describe('parseProjectsUploadText', () => {
  it('parses valid JSON arrays and skips incomplete records', () => {
    const raw = JSON.stringify([
      {
        name: 'Zero Trust Audit',
        description: 'Verify RBAC across endpoints',
        category: 'security',
        status: 'in_progress',
        priority: 'high',
        tasksTotal: 8,
        tasksCompleted: 3,
      },
      { name: 'X' },
    ]);

    const result = parseProjectsUploadText('projects.json', raw);
    expect(result.error).toBeNull();
    expect(result.skipped).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      name: 'Zero Trust Audit',
      category: 'security',
      priority: 'high',
      tasksTotal: 8,
      tasksCompleted: 3,
    });
  });

  it('parses CSV uploads with headers, quoted commas, and status defaults', () => {
    const csv = [
      'name,description,category,status,tasksTotal,tasksCompleted',
      '"Gateway, Core",Harden edge routes,security,completed,5,2',
      'X',
    ].join('\n');

    const result = parseProjectsUploadText('batch.csv', csv);
    expect(result.error).toBeNull();
    expect(result.skipped).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Gateway, Core');
    expect(result.items[0]?.tasksTotal).toBe(5);
    expect(result.items[0]?.tasksCompleted).toBe(5);
  });

  it('rejects empty or malformed uploads cleanly', () => {
    expect(parseProjectsUploadText('bad.json', '{not json')).toMatchObject({
      items: [],
      error: 'Unable to parse file. Provide valid .json or .csv content.',
    });
    expect(parseProjectsUploadText('empty.csv', '   ')).toMatchObject({
      items: [],
      error: 'Selected file is empty.',
    });
  });
});
