'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Project, ClientProject } from '@/types'
import Navbar from '@/components/shared/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderOpen, Plus, Users, CheckSquare } from 'lucide-react'
import { useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuth()

  const [page, setPage] = useState(1)
const [search, setSearch] = useState('')

const { data: response, isLoading, error } = useQuery({
  queryKey: ['projects', page, search],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      rows: '9',
      ...(search && { searchFilters: JSON.stringify({ name: search }) }),
    })
    const res = await api.get(`/api/projects?${params}`)
    return res.data
  },
  enabled: !!user,
})

const data = response?.data
const total = response?.total || 0
const totalPages = Math.ceil(total / 9)

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0d0d0f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0d0d0f]">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user.role === 'CLIENT'
                ? 'Track your project progress'
                : 'Manage and track all your projects'}
            </p>
          </div>
          {user.role === 'PM' && (
            <Button
              onClick={() => router.push('/dashboard/projects/create')}
              className="bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white gap-2"
            >
              <Plus size={16} />
              New Project
            </Button>
          )}
        </div>

        {/* Search */}
        {user.role !== 'CLIENT' && (
        <div className="mb-6">
            <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full max-w-sm px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0d0d0f]"
            />
        </div>
          )}

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500">Gagal memuat projects</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && data?.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Belum ada project</p>
          </div>
        )}

        {/* Client View */}
        {user.role === 'CLIENT' && data && data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((project: ClientProject) => {
              const percent = parseInt(project.progress)
              return (
                <div key={project.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-[#0d0d0f] mb-1">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                  )}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-[#0d0d0f]">{project.progress}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#0d0d0f] h-1.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{task.title}</span>
                        <Badge
                          variant={task.status === 'DONE' ? 'default' : task.status === 'BLOCKED' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PM & Internal View */}
        {user.role !== 'CLIENT' && data && data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((project: Project) => {
              const total = project.tasks?.length || 0
              const done = project.tasks?.filter((t) => t.status === 'DONE').length || 0
              const percent = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-[#0d0d0f] group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5 text-gray-400">
                      <span>Progress</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <div
                        className="bg-[#0d0d0f] h-1 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={12} />
                      {total} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {project.members?.length || 0} members
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
            <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            >
            Previous
            </Button>
            <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
            </span>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            >
            Next
            </Button>
        </div>
        )}
      </div>
    </div>
  )
}