import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import type { ProjectItem, ProjectStatus } from '../../types/auth';
import { deleteProject, listProjects, updateProject } from './projectsApi';

export function useProjectsWorkspace() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const reloadProjects = useCallback(async () => {
    try {
      const items = await listProjects({
        q: search,
        status: statusFilter,
        category: categoryFilter,
      });
      setProjects(items);
      setError(null);
      setLoaded(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load projects.'));
      setLoaded(true);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    const controller = new AbortController();
    listProjects({
      q: search,
      status: statusFilter,
      category: categoryFilter,
      signal: controller.signal,
    })
      .then((items) => {
        setProjects(items);
        setError(null);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load projects.'));
        setLoaded(true);
      });

    return () => controller.abort();
  }, [search, statusFilter, categoryFilter]);

  async function handleQuickCompleteTask(project: ProjectItem) {
    if (project.tasksCompleted >= project.tasksTotal) return;
    setBusyId(project.id);
    try {
      const nextDone = project.tasksCompleted + 1;
      const nextStatus: ProjectStatus =
        nextDone >= project.tasksTotal ? 'completed' : 'in_progress';
      const updated = await updateProject(project.id, {
        tasksCompleted: nextDone,
        status: nextStatus,
      });
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update task count.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(project: ProjectItem) {
    setBusyId(project.id);
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete project.'));
    } finally {
      setBusyId(null);
    }
  }

  return {
    projects,
    loaded,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    busyId,
    completedCount: projects.filter((p) => p.status === 'completed').length,
    inProgressCount: projects.filter((p) => p.status === 'in_progress').length,
    upcomingCount: projects.filter((p) => p.status === 'upcoming').length,
    reloadProjects,
    handleQuickCompleteTask,
    handleDelete,
  };
}
