import { memo } from 'react';
import type {
  ActivityTrendPoint,
  DashboardActivityTrendData,
  DashboardEmployeeStatusData,
  DashboardStatusBreakdownData,
  DashboardTrackProgressData,
  DepartmentProgressItem,
  EmployeeRoleBreakdownItem,
  EmployeeStatusBreakdownItem,
  ProjectStatusBreakdownItem,
} from '../../../types/auth';
import { AccessCoverageChartCard } from './AccessCoverageChartCard';
import { AuthActivityTrendCard } from './AuthActivityTrendCard';
import { ChartCardFrame } from './ChartCardFrame';
import { DirectoryStatusDonutCard } from './DirectoryStatusDonutCard';
import { EmployeeStatusChartCard } from './EmployeeStatusChartCard';

export interface ChartWidgetState<T> {
  data: T | null;
  loading: boolean;
  retrying: boolean;
  error: string | null;
  onRetry: () => void;
}

interface DashboardChartsGridProps {
  trackProgress: ChartWidgetState<DashboardTrackProgressData>;
  statusBreakdown: ChartWidgetState<DashboardStatusBreakdownData>;
  employeeStatus: ChartWidgetState<DashboardEmployeeStatusData>;
  activityTrend: ChartWidgetState<DashboardActivityTrendData>;
}

const EMPTY_DEPARTMENT_PROGRESS: readonly DepartmentProgressItem[] = [];
const EMPTY_STATUS_BREAKDOWN: readonly ProjectStatusBreakdownItem[] = [];
const EMPTY_EMPLOYEE_STATUS: readonly EmployeeStatusBreakdownItem[] = [];
const EMPTY_EMPLOYEE_ROLES: readonly EmployeeRoleBreakdownItem[] = [];
const EMPTY_ACTIVITY_TREND: readonly ActivityTrendPoint[] = [];

export const DashboardChartsGrid = memo(function DashboardChartsGrid({
  trackProgress,
  statusBreakdown,
  employeeStatus,
  activityTrend,
}: DashboardChartsGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-5 md:grid-cols-2"
      aria-label="Live project, employee, and activity charts"
    >
      <ChartCardFrame
        title="Department Progress"
        variant="bar"
        loading={trackProgress.loading}
        retrying={trackProgress.retrying}
        error={trackProgress.error}
        onRetry={trackProgress.onRetry}
      >
        <AccessCoverageChartCard
          averageProgress={trackProgress.data?.averageProgress ?? 0}
          totalProjects={trackProgress.data?.totalProjects ?? 0}
          departmentProgress={trackProgress.data?.departmentProgress ?? EMPTY_DEPARTMENT_PROGRESS}
        />
      </ChartCardFrame>

      <ChartCardFrame
        title="Project Status"
        variant="donut"
        loading={statusBreakdown.loading}
        retrying={statusBreakdown.retrying}
        error={statusBreakdown.error}
        onRetry={statusBreakdown.onRetry}
      >
        <DirectoryStatusDonutCard
          totalProjects={statusBreakdown.data?.totalProjects ?? 0}
          projectStatusBreakdown={
            statusBreakdown.data?.projectStatusBreakdown ?? EMPTY_STATUS_BREAKDOWN
          }
        />
      </ChartCardFrame>

      <ChartCardFrame
        title="Employee Status"
        variant="donut"
        loading={employeeStatus.loading}
        retrying={employeeStatus.retrying}
        error={employeeStatus.error}
        onRetry={employeeStatus.onRetry}
      >
        <EmployeeStatusChartCard
          totalEmployees={employeeStatus.data?.totalEmployees ?? 0}
          statusBreakdown={employeeStatus.data?.statusBreakdown ?? EMPTY_EMPLOYEE_STATUS}
          roleBreakdown={employeeStatus.data?.roleBreakdown ?? EMPTY_EMPLOYEE_ROLES}
        />
      </ChartCardFrame>

      <ChartCardFrame
        title="Activity Trend"
        variant="trend"
        loading={activityTrend.loading}
        retrying={activityTrend.retrying}
        error={activityTrend.error}
        onRetry={activityTrend.onRetry}
      >
        <AuthActivityTrendCard
          activityTrend={activityTrend.data?.activityTrend ?? EMPTY_ACTIVITY_TREND}
        />
      </ChartCardFrame>
    </section>
  );
});
