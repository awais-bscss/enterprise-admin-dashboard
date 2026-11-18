import { memo } from 'react';
import { useTheme } from '../../../theme/themeContext';
import { CHART_SERIES_TOKENS, getChartPalette } from '../../../theme/tokens';
import type { ProjectStatus, ProjectStatusBreakdownItem } from '../../../types/auth';
import { StatusDonutCard, type DonutSliceInput } from './StatusDonutCard';

interface DirectoryStatusDonutCardProps {
  totalProjects: number;
  projectStatusBreakdown: readonly ProjectStatusBreakdownItem[];
}

const STATUS_META: Record<ProjectStatus, { label: string; barClass: string }> = {
  completed: {
    label: 'Completed',
    barClass: CHART_SERIES_TOKENS.mint.barClass,
  },
  in_progress: {
    label: 'In Progress',
    barClass: CHART_SERIES_TOKENS.rose.barClass,
  },
  upcoming: {
    label: 'Upcoming',
    barClass: CHART_SERIES_TOKENS.sky.barClass,
  },
};

export const DirectoryStatusDonutCard = memo(function DirectoryStatusDonutCard({
  totalProjects,
  projectStatusBreakdown,
}: DirectoryStatusDonutCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);

  const fillMap: Record<ProjectStatus, string> = {
    completed: chart.series.mint.fill,
    in_progress: chart.series.rose.border,
    upcoming: chart.series.sky.fillStop,
  };

  const slices: DonutSliceInput[] = projectStatusBreakdown.map((item) => ({
    key: item.status,
    label: STATUS_META[item.status].label,
    count: item.count,
    fill: fillMap[item.status],
    barClass: STATUS_META[item.status].barClass,
  }));

  return (
    <StatusDonutCard
      title="Project Status"
      totalCount={totalProjects}
      itemNoun="projects"
      emptyLabel="No projects yet"
      slices={slices}
    />
  );
});
