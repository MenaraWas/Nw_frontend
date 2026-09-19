'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Task } from '@/types'
import Navbar from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function ManageMembersPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isInitialized } = useAuth('PM')
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [reassignMap, setReassignMap] = useState<Record<string, string>>({})

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${projectId}`)
      return res.data.data
    },
    enabled: !!user && !!projectId,
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/api/users')
      return res.data.data
    },
    enabled: !!user,
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/tasks/project/${projectId}`)
      return res.data.data as Task[]
    },
    enabled: !!user && !!projectId,
  })

  const addMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/api/projects/${projectId}/members`, { userId })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal menambah member')
    },
  })

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/api/projects/${projectId}/members/${userId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setExpandedMember(null)
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal menghapus member')
    },
  })

  const reassignTask = useMutation({
    mutationFn: async ({ taskId, assigneeId }: { taskId: string; assigneeId: string }) => {
      const res = await api.patch(`/api/tasks/${taskId}/assignee`, { assigneeId })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal reassign task')
    },
  })

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0d0d0f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const memberIds = project?.members?.map((m: any) => m.user.id) || []
  const nonMembers = allUsers?.filter((u: any) => !memberIds.includes(u.id) && u.role !== 'CLIENT') || []

  const getActiveTasks = (userId: string) =>
    tasks?.filter((t) => t.assigneeId === userId && t.status !== 'DONE') || []

  const otherMembers = (excludeUserId: string) =>
    project?.members?.filter((m: any) => m.user.id !== excludeUserId && m.user.role !== 'CLIENT') || []

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Navbar
        showBack
        backHref={`/dashboard/projects/${projectId}`}
        title="Manage Members"
      />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Current Members */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#0d0d0f] mb-4">
            Current Members ({project?.members?.length || 0})
          </h2>
          <div className="divide-y divide-gray-100">
            {project?.members?.map((member: any) => {
              const activeTasks = getActiveTasks(member.user.id)
              const isExpanded = expandedMember === member.user.id

              return (
                <div key={member.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                      <p className="text-xs text-gray-400">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.user.department || member.user.role}
                      </Badge>
                      {activeTasks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {activeTasks.length} active tasks
                        </Badge>
                      )}
                      {member.user.id !== user.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (activeTasks.length > 0) {
                              setExpandedMember(isExpanded ? null : member.user.id)
                              setError('')
                            } else {
                              removeMember.mutate(member.user.id)
                            }
                          }}
                          disabled={removeMember.isPending}
                          className="text-red-400 border-red-200 hover:bg-red-50 text-xs gap-1"
                        >
                          <Trash2 size={12} />
                          Remove
                          {activeTasks.length > 0 && (
                            isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Active tasks with reassign */}
                  {isExpanded && activeTasks.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-xs text-amber-700 font-medium">
                        Reassign semua task aktif sebelum menghapus member ini:
                      </p>
                      {activeTasks.map((task) => (
                        <div key={task.id} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-medium text-gray-700">{task.title}</p>
                            <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={reassignMap[task.id] || ''}
                              onChange={(e) =>
                                setReassignMap((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d0d0f] bg-white"
                            >
                              <option value="">Pilih member...</option>
                              {otherMembers(member.user.id).map((m: any) => (
                                <option key={m.user.id} value={m.user.id}>
                                  {m.user.name} ({m.user.department || m.user.role})
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              disabled={!reassignMap[task.id] || reassignTask.isPending}
                              onClick={() =>
                                reassignTask.mutate({
                                  taskId: task.id,
                                  assigneeId: reassignMap[task.id],
                                })
                              }
                              className="bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white text-xs"
                            >
                              Reassign
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeMember.mutate(member.user.id)}
                        disabled={
                          removeMember.isPending ||
                          getActiveTasks(member.user.id).length > 0
                        }
                        className="w-full text-red-400 border-red-200 hover:bg-red-50 text-xs mt-2"
                      >
                        Remove Member
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Members */}
        {nonMembers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#0d0d0f] mb-4">Add Members</h2>
            <div className="divide-y divide-gray-100">
              {nonMembers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {u.department || u.role}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => addMember.mutate(u.id)}
                      disabled={addMember.isPending}
                      className="bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white text-xs gap-1"
                    >
                      <UserPlus size={12} />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          className="w-full bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white"
        >
          Done
        </Button>
      </div>
    </div>
  )
}