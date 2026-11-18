import { describe, expect, it } from 'vitest';
import { executeWorkerTask } from './reportSerializer';

describe('reportSerializer', () => {
  it('formats structured JSON reports with indentation', () => {
    const output = executeWorkerTask({
      type: 'FORMAT_JSON_REPORT',
      payload: { service: 'pms', totals: { active: 3 } },
    });

    expect(JSON.parse(output)).toEqual({ service: 'pms', totals: { active: 3 } });
    expect(output).toContain('\n  "service": "pms"');
  });

  it('escapes quotes, commas, null values, and formula-injection prefixes in CSV cells', () => {
    const csv = executeWorkerTask({
      type: 'BUILD_CSV_REPORT',
      headers: ['Name', 'Formula', 'Notes'],
      rows: [
        ['Core "Gateway"', '=SUM(A1:A2)', null],
        ['Alert, Ops', '+cmd', '@admin'],
      ],
    });

    expect(csv).toBe(
      [
        '"Name","Formula","Notes"',
        '"Core ""Gateway""","\'=SUM(A1:A2)",""',
        '"Alert, Ops","\'+cmd","\'@admin"',
      ].join('\n'),
    );
  });
});
