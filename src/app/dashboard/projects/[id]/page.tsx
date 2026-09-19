'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Task, TaskStatus } from '@/types'
import Navbar from '@/components/shared/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Lock, ChevronRight, Users } from 'lucide-react'

const COLUMNS: { status: TaskStatus; label: string; color: string; border: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-gray-50', border: 'border-gray-200' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50', border: 'border-blue-200' },
  { status: 'DONE', label: 'Done', color: 'bg-green-50', border: 'border-green-200' },
  { status: 'BLOCKED', label: 'Blocked', color: 'bg-red-50', border: 'border-red-200' },
]

const BADGE_MAP: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'outline',
  DONE: 'default',
  BLOCKED: 'destructive',
}

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
}

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState('')

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${projectId}`)
      return res.data.data
    },
    enabled: !!user && !!projectId,
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/tasks/project/${projectId}`)
      return res.data.data as Task[]
    },
    enabled: !!user && !!projectId,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, status, version }: { taskId: string; status: TaskStatus; version: number }) => {
      const res = await api.patch(`/api/tasks/${taskId}/status`, { status, version })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setErrorMsg('')
    },
    onError: (err: unknown) => {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined
      setErrorMsg(message || 'Gagal mengupdate status')
      setTimeout(() => setErrorMsg(''), 4000)
    },
  })

  const canMove = (task: Task, next: TaskStatus): boolean => {
    if (!user) return false
    if (user.role === 'CLIENT') return false
    if (user.role === 'PM' && next === 'DONE') return false
    if (task.status === 'BLOCKED') return false
    if (next === 'DONE' && task.assigneeId !== user.id) return false
    return true
  }

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0d0d0f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Navbar
        showBack
        backHref="/dashboard"
        title={projectLoading ? 'Loading...' : project?.name || 'Project'}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Project board
            </p>
            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              {project?.description || 'Track progress and keep the team moving.'}
            </p>
          </div>
          {user.role === 'PM' && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${projectId}/members`)}
                className="w-full gap-2 sm:w-auto"
              >
                <Users size={16} />
                Manage Members
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/projects/${projectId}/tasks/create`)}
                className="w-full gap-2 bg-[#0d0d0f] text-white hover:bg-[#0d0d0f]/90 sm:w-auto"
              >
                <Plus size={16} />
                Add Task
              </Button>
            </div>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(({ status, label, color, border }) => {
            const columnTasks = tasks?.filter((t) => t.status === status) || []
            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column Header */}
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${color} ${border}`}>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="rounded-full border bg-white px-2 py-0.5 text-xs text-gray-400">
                    {tasksLoading ? '...' : columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-2 min-h-24">
                  {tasksLoading && (
                    <div className="bg-white rounded-xl p-4 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  )}

                  {columnTasks.map((task) => {
                    const next = NEXT_STATUS[task.status]
                    const movable = next && canMove(task, next)
                    const allDepsDone = task.dependencies?.every(
                      (d) => d.prerequisite.status === 'DONE'
                    ) ?? true

                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Task header */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <p className="min-w-0 text-sm font-medium leading-snug text-[#0d0d0f]">{task.title}</p>
                          {task.status === 'BLOCKED' && (
                            <Lock size={12} className="text-red-400 shrink-0 mt-0.5" />
                          )}
                        </div>

                        <Badge variant={BADGE_MAP[task.status]} className="mb-2">
                          {label}
                        </Badge>

                        {/* Assignee */}
                        {task.assignee && (
                          <p className="text-xs text-gray-400 mb-2">
                            {task.assignee.name}
                            {task.assignee.department && ` · ${task.assignee.department}`}
                          </p>
                        )}

                        {/* Dependencies */}
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="mb-2.5 space-y-1">
                            {task.dependencies.map((dep) => (
                              <div key={dep.id} className="flex items-center gap-1.5 text-xs">
                                <span className={dep.prerequisite.status === 'DONE' ? 'text-green-500' : 'text-red-400'}>
                                  {dep.prerequisite.status === 'DONE' ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-400 truncate">{dep.prerequisite.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Move button */}
                        {movable && (
                          <button
                            onClick={() => updateStatus.mutate({ taskId: task.id, status: next!, version: task.version })}
                            disabled={updateStatus.isPending || !allDepsDone}
                            className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-[#0d0d0f] border border-gray-200 hover:border-gray-400 rounded-lg py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Move to {next?.replace('_', ' ')}
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {!tasksLoading && columnTasks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-300">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}