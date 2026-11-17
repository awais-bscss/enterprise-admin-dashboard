import {
  type MetricTrend,
  type ParsedInsightPayload,
  validateStructuredResponse,
} from './schema.ts';

export type RenderMode = 'full' | 'degraded' | 'fallback';

export interface ViewMetricCard {
  id: string;
  label: string;
  displayValue: string;
  numericValue: number;
  trendLabel: 'Improving' | 'Declining' | 'Stable';
  trend: MetricTrend;
  href: string | null;
}

export interface StructuredInsightViewModel {
  renderMode: RenderMode;
  schemaVersion: 'v1' | 'v2' | 'unknown';
  title: string;
  summary: string;
  confidenceBadge: string;
  averageMetricScore: number;
  cards: ViewMetricCard[];
  recommendations: string[];
  diagnostics: string[];
}

const TREND_LABEL_MAP: Record<MetricTrend, ViewMetricCard['trendLabel']> = {
  up: 'Improving',
  down: 'Declining',
  flat: 'Stable',
};

function transformPayloadToViewModel(
  payload: ParsedInsightPayload,
  renderMode: 'full' | 'degraded',
  diagnostics: string[],
): StructuredInsightViewModel {
  const cards: ViewMetricCard[] = payload.metrics.map((metric) => ({
    id: metric.id,
    label: metric.label,
    displayValue: `${metric.score}%`,
    numericValue: metric.score,
    trendLabel: TREND_LABEL_MAP[metric.trend],
    trend: metric.trend,
    href: metric.referenceUrl,
  }));

  const averageMetricScore =
    cards.length > 0
      ? Math.round(cards.reduce((sum, card) => sum + card.numericValue, 0) / cards.length)
      : 0;

  return {
    renderMode,
    schemaVersion: payload.schemaVersion,
    title: payload.title,
    summary: payload.summary,
    confidenceBadge: `${Math.round(payload.confidence * 100)}% confidence`,
    averageMetricScore,
    cards,
    recommendations: payload.recommendations,
    diagnostics,
  };
}

export function adaptStructuredInsight(rawInput: unknown): StructuredInsightViewModel {
  const validated = validateStructuredResponse(rawInput);

  if (validated.severity === 'invalid' || !validated.payload) {
    return {
      renderMode: 'fallback',
      schemaVersion: 'unknown',
      title: 'Insight Unavailable',
      summary:
        'External structured output failed runtime validation and was safely suppressed to protect rendering integrity.',
      confidenceBadge: '0% confidence',
      averageMetricScore: 0,
      cards: [],
      recommendations: [],
      diagnostics: validated.warnings,
    };
  }

  return transformPayloadToViewModel(
    validated.payload,
    validated.severity === 'partial' ? 'degraded' : 'full',
    validated.warnings,
  );
}

export function createTopMetricsSelector(limit = 5) {
  let prevCards: readonly ViewMetricCard[] | null = null;
  let prevResult: ViewMetricCard[] = [];

  return (cards: readonly ViewMetricCard[]): ViewMetricCard[] => {
    if (prevCards === cards) {
      return prevResult;
    }
    prevCards = cards;
    prevResult = [...cards]
      .sort((a, b) => b.numericValue - a.numericValue)
      .slice(0, limit);
    return prevResult;
  };
}
