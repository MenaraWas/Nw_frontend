'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus } from '@/types'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Lock, Paperclip, Clock } from 'lucide-react'

interface TaskModalProps {
  task: Task
  projectId: string
  onClose: () => void
}

const BADGE_MAP: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'outline',
  DONE: 'default',
  BLOCKED: 'destructive',
}

export default function TaskModal({ task, projectId, onClose }: TaskModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [description, setDescription] = useState(task.description || '')
  const [attachment, setAttachment] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateDescription = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/tasks/${task.id}/description`, {
        description,
        version: task.version,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setEditingDesc(false)
      setSuccess('Description updated')
      setTimeout(() => setSuccess(''), 2000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal update description')
      setTimeout(() => setError(''), 3000)
    },
  })

  const uploadAttachment = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/tasks/${task.id}/attachment`, { attachment })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setAttachment('')
      setSuccess('Attachment uploaded')
      setTimeout(() => setSuccess(''), 2000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal upload attachment')
      setTimeout(() => setError(''), 3000)
    },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={BADGE_MAP[task.status]}>{task.status}</Badge>
              {task.status === 'BLOCKED' && <Lock size={14} className="text-red-400" />}
            </div>
            <h2 className="text-base font-semibold text-[#0d0d0f]">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Feedback */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Assigned to</p>
              <p className="text-sm font-medium text-gray-700">
                {task.assignee.name}
                {task.assignee.department && (
                  <span className="text-gray-400 font-normal"> · {task.assignee.department}</span>
                )}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-gray-400">Description</p>
              {user?.role === 'PM' && !editingDesc && (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>

            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d0d0f] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDesc(false)
                      setDescription(task.description || '')
                    }}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateDescription.mutate()}
                    disabled={updateDescription.isPending}
                    className="flex-1 bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {task.description || <span className="text-gray-300 italic">No description</span>}
              </p>
            )}
          </div>

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Dependencies</p>
              <div className="space-y-1.5">
                {task.dependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-2 text-sm">
                    <span className={dep.prerequisite.status === 'DONE' ? 'text-green-500' : 'text-red-400'}>
                      {dep.prerequisite.status === 'DONE' ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-600">{dep.prerequisite.title}</span>
                    <Badge variant={BADGE_MAP[dep.prerequisite.status]} className="text-xs ml-auto">
                      {dep.prerequisite.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Attachment (Internal only) */}
          {user?.role === 'INTERNAL' && (
            <div>
                <p className="text-xs text-gray-400 mb-2">Upload Attachment</p>
                <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Paperclip size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-400">
                    {attachment ? attachment : 'Click to choose file'}
                    </span>
                    <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setAttachment(file.name)
                    }}
                    />
                </label>
                {attachment && (
                    <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600 truncate">
                        {attachment}
                    </div>
                    <Button
                        size="sm"
                        onClick={() => uploadAttachment.mutate()}
                        disabled={uploadAttachment.isPending}
                        className="bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white gap-1 shrink-0"
                    >
                        <Paperclip size={12} />
                        {uploadAttachment.isPending ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAttachment('')}
                        className="shrink-0"
                    >
                        <X size={12} />
                    </Button>
                    </div>
                )}
                </div>
            </div>
            )}
        
            {/* Attachments dari audit log */}
            {task.auditLogs && task.auditLogs.filter(l => l.column === 'attachment').length > 0 && (
            <div>
                <p className="text-xs text-gray-400 mb-2">Attachments</p>
                <div className="space-y-1.5">
                {task.auditLogs
                    .filter(l => l.column === 'attachment')
                    .map((log) => (
                    <div key={log.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <Paperclip size={12} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600 flex-1 truncate">{log.newValue}</span>
                        <span className="text-xs text-gray-300">
                        {new Date(log.createdAt).toLocaleDateString('id-ID')}
                        </span>
                    </div>
                    ))}
                </div>
            </div>
            )}

          {/* Audit Log */}
          {task.auditLogs && task.auditLogs.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Recent Activity</p>
              <div className="space-y-2">
                {task.auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-2 text-xs">
                    <Clock size={12} className="text-gray-300 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-600">{log.user?.name}</span>
                      <span className="text-gray-400"> changed </span>
                      <span className="font-medium text-gray-600">{log.column}</span>
                      {log.oldValue && (
                        <>
                          <span className="text-gray-400"> from </span>
                          <span className="text-red-400">{log.oldValue}</span>
                        </>
                      )}
                      {log.newValue && (
                        <>
                          <span className="text-gray-400"> to </span>
                          <span className="text-green-500">{log.newValue}</span>
                        </>
                      )}
                      <p className="text-gray-300 mt-0.5">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client visible indicator */}
          {task.clientVisible && (
            <div className="flex items-center gap-2 text-xs text-blue-500 bg-blue-50 px-3 py-2 rounded-lg">
              <span>👁</span>
              <span>Visible to client</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}