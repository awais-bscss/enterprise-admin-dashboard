import { memo } from 'react';
import type {
  ActivityTrendPoint,
  CategoryProgressItem,
  ProjectStatusBreakdownItem,
} from '../../../types/auth';
import { AccessCoverageChartCard } from './AccessCoverageChartCard';
import { AuthActivityTrendCard } from './AuthActivityTrendCard';
import { DirectoryStatusDonutCard } from './DirectoryStatusDonutCard';

interface DashboardChartsGridProps {
  averageProgress: number;
  totalProjects: number;
  categoryProgress: readonly CategoryProgressItem[];
  projectStatusBreakdown: readonly ProjectStatusBreakdownItem[];
  activityTrend: readonly ActivityTrendPoint[];
}

export const DashboardChartsGrid = memo(function DashboardChartsGrid({
  averageProgress,
  totalProjects,
  categoryProgress,
  projectStatusBreakdown,
  activityTrend,
}: DashboardChartsGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      aria-label="Live project and activity charts"
    >
      <AccessCoverageChartCard
        averageProgress={averageProgress}
        totalProjects={totalProjects}
        categoryProgress={categoryProgress}
      />

      <DirectoryStatusDonutCard
        totalProjects={totalProjects}
        projectStatusBreakdown={projectStatusBreakdown}
      />

      <AuthActivityTrendCard activityTrend={activityTrend} />
    </section>
  );
});
