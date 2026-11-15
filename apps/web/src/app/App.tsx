import { HealthStatusCard } from '../features/health/HealthStatusCard';

export function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Enterprise Administration Dashboard</h1>
        <p className="muted">System foundation and API gateway health monitor.</p>
      </header>
      <HealthStatusCard />
    </main>
  );
}
