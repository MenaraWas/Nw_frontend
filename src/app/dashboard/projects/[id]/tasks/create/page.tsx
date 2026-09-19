'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Task } from '@/types'
import Navbar from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function CreateTaskPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isInitialized } = useAuth('PM')
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [clientVisible, setClientVisible] = useState(false)
  const [dependencyIds, setDependencyIds] = useState<string[]>([])
  const [error, setError] = useState('')

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${projectId}`)
      return res.data.data
    },
    enabled: !!user && !!projectId,
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/tasks/project/${projectId}`)
      return res.data.data as Task[]
    },
    enabled: !!user && !!projectId,
  })

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/tasks', {
        projectId,
        title,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        clientVisible,
        dependencyIds,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      router.push(`/dashboard/projects/${projectId}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal membuat task')
    },
  })

  const toggleDep = (id: string) => {
    setDependencyIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0d0d0f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const members = project?.members?.filter((m: any) => m.user.role !== 'CLIENT') || []

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Navbar
        showBack
        backHref={`/dashboard/projects/${projectId}`}
        title="Create Task"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#0d0d0f] mb-6">New Task</h2>

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-200 focus:border-[#0d0d0f]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Description</Label>
              <textarea
                placeholder="Task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d0d0f] resize-none"
              />
            </div>

            {/* Assign To */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Assign To</Label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d0d0f] bg-white"
              >
                <option value="">Unassigned</option>
                {members.map((member: any) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name} ({member.user.department || member.user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Client Visible */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="clientVisible"
                checked={clientVisible}
                onChange={(e) => setClientVisible(e.target.checked)}
                className="w-4 h-4 accent-[#0d0d0f]"
              />
              <div>
                <label htmlFor="clientVisible" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Visible to Client
                </label>
                <p className="text-xs text-gray-400">Client can see this task in their dashboard</p>
              </div>
            </div>

            {/* Dependencies */}
            {tasks && tasks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Dependencies</Label>
                <p className="text-xs text-gray-400">
                  This task will be BLOCKED until selected tasks are DONE
                </p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {tasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleDep(task.id)}
                    >
                      <input
                        type="checkbox"
                        checked={dependencyIds.includes(task.id)}
                        onChange={() => toggleDep(task.id)}
                        className="w-4 h-4 accent-[#0d0d0f]"
                      />
                      <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                      <Badge
                        variant={BADGE_MAP[task.status]}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createTask.mutate()}
                disabled={!title.trim() || createTask.isPending}
                className="flex-1 bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white"
              >
                {createTask.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BADGE_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'outline',
  DONE: 'default',
  BLOCKED: 'destructive',
}