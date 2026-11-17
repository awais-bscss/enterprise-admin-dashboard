export type ParseSeverity = 'valid' | 'partial' | 'invalid';

export type MetricTrend = 'up' | 'down' | 'flat';

export interface ParsedInsightMetric {
  id: string;
  label: string;
  score: number;
  trend: MetricTrend;
  referenceUrl: string | null;
}

export interface ParsedInsightPayload {
  schemaVersion: 'v1' | 'v2';
  title: string;
  summary: string;
  confidence: number;
  metrics: ParsedInsightMetric[];
  recommendations: string[];
}

export interface StructuredParseResult {
  severity: ParseSeverity;
  payload: ParsedInsightPayload | null;
  warnings: string[];
}

const FENCED_JSON_RE = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
const HTML_TAG_RE = /<[^>]*>/g;
const SAFE_HTTP_URL_RE = /^https?:\/\//i;

export function sanitizePlainText(input: unknown, maxLength = 240): string {
  if (typeof input !== 'string') return '';
  const withoutTags = input.replace(HTML_TAG_RE, '');
  const cleaned = Array.from(withoutTags, (ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : ch;
  }).join('');
  return cleaned.trim().slice(0, maxLength);
}

export function sanitizeSafeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  if (SAFE_HTTP_URL_RE.test(trimmed)) return trimmed;
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseFiniteNumber(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string' && input.trim() !== '') {
    const parsed = Number(input.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeTrend(input: unknown): MetricTrend {
  if (input === 'up' || input === 'increasing' || input === 'positive') return 'up';
  if (input === 'down' || input === 'decreasing' || input === 'negative') return 'down';
  return 'flat';
}

export function extractJsonCandidate(rawInput: unknown): {
  value: unknown;
  parseError?: string;
} {
  if (rawInput === null || rawInput === undefined) {
    return { value: null, parseError: 'Empty response received.' };
  }
  if (typeof rawInput === 'object') {
    return { value: rawInput };
  }
  if (typeof rawInput !== 'string') {
    return { value: null, parseError: `Unsupported response type "${typeof rawInput}".` };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { value: null, parseError: 'Response string was blank.' };
  }

  const fencedMatch = trimmed.match(FENCED_JSON_RE);
  const jsonSource = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return { value: JSON.parse(jsonSource) as unknown };
  } catch (err) {
    return {
      value: null,
      parseError: err instanceof Error ? `Malformed JSON: ${err.message}` : 'Malformed JSON.',
    };
  }
}

export function validateStructuredResponse(rawInput: unknown): StructuredParseResult {
  const warnings: string[] = [];
  const extracted = extractJsonCandidate(rawInput);

  if (extracted.parseError || !extracted.value || typeof extracted.value !== 'object' || Array.isArray(extracted.value)) {
    return {
      severity: 'invalid',
      payload: null,
      warnings: [extracted.parseError ?? 'Response root must be a JSON object.'],
    };
  }

  const record = extracted.value as Record<string, unknown>;
  const rawTitle = sanitizePlainText(record.title ?? record.headline, 120);
  const rawSummary = sanitizePlainText(record.summary ?? record.description, 400);

  if (!rawTitle && !rawSummary) {
    return {
      severity: 'invalid',
      payload: null,
      warnings: ['Missing both title and summary fields in structured payload.'],
    };
  }

  const schemaVersion: 'v1' | 'v2' =
    Array.isArray(record.kpis) || 'headline' in record ? 'v2' : 'v1';

  const title = rawTitle || 'Untitled Operational Insight';
  if (!rawTitle) warnings.push('Missing title; applied safe fallback heading.');

  const summary = rawSummary || 'Partial narrative returned without summary text.';
  if (!rawSummary) warnings.push('Missing summary text; rendering partial metric breakdown only.');

  const parsedConfidence = parseFiniteNumber(record.confidence ?? record.score);
  let confidence = 0.5;
  if (parsedConfidence === null) {
    warnings.push('Missing or non-numeric confidence score; defaulted to 0.50.');
  } else {
    const normalized = parsedConfidence > 1 ? parsedConfidence / 100 : parsedConfidence;
    confidence = clamp(Number(normalized.toFixed(2)), 0, 1);
    if (normalized < 0 || normalized > 1) {
      warnings.push('Confidence value out of bounds; clamped into [0, 1].');
    }
  }

  const rawMetricList = Array.isArray(record.metrics)
    ? record.metrics
    : Array.isArray(record.kpis)
      ? record.kpis
      : null;

  const metrics: ParsedInsightMetric[] = [];
  if (!rawMetricList) {
    warnings.push('Metric array missing; metric cards omitted.');
  } else {
    rawMetricList.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        warnings.push(`Skipped non-object metric entry at index ${index}.`);
        return;
      }

      const item = entry as Record<string, unknown>;
      const label = sanitizePlainText(item.label ?? item.name, 80);
      const numericScore = parseFiniteNumber(item.score ?? item.value);

      if (!label || numericScore === null) {
        warnings.push(`Skipped incomplete metric entry at index ${index}.`);
        return;
      }

      const safeScore = clamp(Math.round(numericScore), 0, 100);
      if (safeScore !== Math.round(numericScore)) {
        warnings.push(`Clamped out-of-range score for "${label}".`);
      }

      const unsafeOrMissingUrl = item.referenceUrl ?? item.url;
      const safeUrl = sanitizeSafeUrl(unsafeOrMissingUrl);
      if (typeof unsafeOrMissingUrl === 'string' && unsafeOrMissingUrl.trim() && !safeUrl) {
        warnings.push(`Blocked unsafe URL protocol on metric "${label}".`);
      }

      metrics.push({
        id: sanitizePlainText(item.id, 40) || `metric-${index + 1}`,
        label,
        score: safeScore,
        trend: normalizeTrend(item.trend),
        referenceUrl: safeUrl,
      });
    });
  }

  const recommendations: string[] = [];
  if (Array.isArray(record.recommendations)) {
    record.recommendations.forEach((rec, index) => {
      const clean = sanitizePlainText(rec, 200);
      if (clean) {
        recommendations.push(clean);
      } else {
        warnings.push(`Ignored invalid recommendation at index ${index}.`);
      }
    });
  }

  return {
    severity: warnings.length > 0 ? 'partial' : 'valid',
    payload: {
      schemaVersion,
      title,
      summary,
      confidence,
      metrics,
      recommendations,
    },
    warnings,
  };
}
