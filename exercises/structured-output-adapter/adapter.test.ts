import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adaptStructuredInsight, createTopMetricsSelector } from './adapter.ts';

describe('structured output runtime validation and adapter', () => {
  it('adapts clean v1 JSON into full render mode', () => {
    const raw = JSON.stringify({
      title: 'Access Governance Summary',
      summary: 'Role permissions and refresh token rotation remain within SLA.',
      confidence: 0.94,
      metrics: [
        { id: 'm1', label: 'Session Health', score: 99, trend: 'up', referenceUrl: '/dashboard' },
        { id: 'm2', label: 'Policy Coverage', score: 85, trend: 'flat' },
      ],
      recommendations: ['Enable shared rate-limit storage in multi-region clusters.'],
    });

    const viewModel = adaptStructuredInsight(raw);

    assert.equal(viewModel.renderMode, 'full');
    assert.equal(viewModel.schemaVersion, 'v1');
    assert.equal(viewModel.confidenceBadge, '94% confidence');
    assert.equal(viewModel.averageMetricScore, 92);
    assert.equal(viewModel.cards.length, 2);
    assert.equal(viewModel.cards[0]?.trendLabel, 'Improving');
    assert.deepEqual(viewModel.diagnostics, []);
  });

  it('handles schema drift (v2 keys, fenced JSON, percentage confidence) and filters corrupt rows into degraded mode', () => {
    const raw = [
      '```json',
      JSON.stringify({
        headline: 'Quarterly Posture Brief',
        description: 'Partial metrics parsed despite malformed entries.',
        score: 82,
        kpis: [
          { name: 'CSP Hygiene', value: '96', trend: 'increasing', url: 'https://example.test/csp' },
          { name: 'Broken Row', value: 'NaN' },
          { name: 'XSS URI', value: 150, trend: 'decreasing', url: 'javascript:alert(1)' },
        ],
        recommendations: ['<b>Rotate secrets quarterly</b>', 42],
      }),
      '```',
    ].join('\n');

    const viewModel = adaptStructuredInsight(raw);

    assert.equal(viewModel.renderMode, 'degraded');
    assert.equal(viewModel.schemaVersion, 'v2');
    assert.equal(viewModel.confidenceBadge, '82% confidence');
    assert.equal(viewModel.cards.length, 2);
    assert.equal(viewModel.cards[0]?.displayValue, '96%');
    assert.equal(viewModel.cards[1]?.numericValue, 100);
    assert.equal(viewModel.cards[1]?.href, null);
    assert.deepEqual(viewModel.recommendations, ['Rotate secrets quarterly']);
    assert.ok(viewModel.diagnostics.some((msg) => msg.includes('Blocked unsafe URL')));
  });

  it('returns safe fallback state when payload is malformed JSON or missing critical fields', () => {
    const broken = adaptStructuredInsight('{ "title": "Broken", ');
    assert.equal(broken.renderMode, 'fallback');
    assert.equal(broken.title, 'Insight Unavailable');
    assert.equal(broken.cards.length, 0);
    assert.ok(broken.diagnostics[0]?.startsWith('Malformed JSON'));

    const emptyRoot = adaptStructuredInsight(['not', 'an', 'object']);
    assert.equal(emptyRoot.renderMode, 'fallback');
  });

  it('preserves array reference identity in createTopMetricsSelector when input reference is unchanged', () => {
    const selectTop = createTopMetricsSelector(2);
    const cards = adaptStructuredInsight({
      title: 'Demo',
      summary: 'Metrics',
      confidence: 0.9,
      metrics: [
        { label: 'Low', score: 20, trend: 'down' },
        { label: 'High', score: 95, trend: 'up' },
        { label: 'Mid', score: 65, trend: 'flat' },
      ],
    }).cards;

    const first = selectTop(cards);
    const second = selectTop(cards);

    assert.strictEqual(first, second);
    assert.deepEqual(
      first.map((item) => item.label),
      ['High', 'Mid'],
    );
  });
});
