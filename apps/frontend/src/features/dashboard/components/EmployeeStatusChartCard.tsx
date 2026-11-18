import { memo } from 'react';
import { useTheme } from '../../../theme/themeContext';
import { BADGE_TOKENS, CHART_SERIES_TOKENS, getChartPalette } from '../../../theme/tokens';
import type {
  EmployeeRoleBreakdownItem,
  EmployeeStatusBreakdownItem,
} from '../../../types/auth';
import { StatusDonutCard, type DonutSliceInput } from './StatusDonutCard';

interface EmployeeStatusChartCardProps {
  totalEmployees: number;
  statusBreakdown: readonly EmployeeStatusBreakdownItem[];
  roleBreakdown: readonly EmployeeRoleBreakdownItem[];
}

const EMPLOYEE_STATUS_META: Record<'active' | 'suspended', { label: string; barClass: string }> = {
  active: {
    label: 'Active',
    barClass: CHART_SERIES_TOKENS.mint.barClass,
  },
  suspended: {
    label: 'Suspended',
    barClass: CHART_SERIES_TOKENS.rose.barClass,
  },
};

export const EmployeeStatusChartCard = memo(function EmployeeStatusChartCard({
  totalEmployees,
  statusBreakdown,
  roleBreakdown,
}: EmployeeStatusChartCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);

  const fillMap: Record<'active' | 'suspended', string> = {
    active: chart.series.mint.fill,
    suspended: chart.series.rose.border,
  };

  const slices: DonutSliceInput[] = statusBreakdown.map((item) => ({
    key: item.status,
    label: EMPLOYEE_STATUS_META[item.status].label,
    count: item.count,
    fill: fillMap[item.status],
    barClass: EMPLOYEE_STATUS_META[item.status].barClass,
  }));

  return (
    <StatusDonutCard
      title="Employee Status"
      totalCount={totalEmployees}
      itemNoun="employees"
      emptyLabel="No employees yet"
      slices={slices}
      footer={
        roleBreakdown.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {roleBreakdown.map((item) => (
              <span
                key={item.role}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${BADGE_TOKENS.role[item.role]}`}
              >
                {item.role}: <span className="tabular-nums">{item.count}</span>
              </span>
            ))}
          </div>
        ) : null
      }
    />
  );
});
