# Structured Output Runtime Validation & Adapter

Standalone exercise isolated from the main application runtime (`apps/web`, `apps/api`).

## What It Demonstrates

1. **Untrusted Output Boundary:** Treats external model JSON responses (`string`, fenced markdown ````json`, or raw objects) as untrusted input validated via [`schema.ts`](schema.ts).
2. **Schema Drift & Partial Degradation:** Normalizes `v1` (`title`, `summary`, `confidence`, `metrics`) and `v2` (`headline`, `description`, `score`, `kpis`) shapes, filters corrupt metric items cleanly, clamps out-of-range metrics (`0..100`), strips HTML markup, and blocks unsafe URL protocols (`javascript:`, `data:`).
3. **Resilient UI Adapter:** Transforms validated outputs into a strict [`StructuredInsightViewModel`](adapter.ts) with explicit `'full' | 'degraded' | 'fallback'` rendering modes and reference-stable derived selectors (`createTopMetricsSelector`).

## Run Exercise Tests

Requires Node.js 24+ native TypeScript execution:

```bash
node --test exercises/structured-output-adapter/adapter.test.ts
```
