'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import Navbar from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateProjectPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuth('PM')
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/projects', { name, description })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/dashboard/projects/${data.data.id}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gagal membuat project')
    },
  })

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
        title="Create Project"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#0d0d0f] mb-6">New Project</h2>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">
                Project Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-200 focus:border-[#0d0d0f]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">Description</Label>
              <textarea
                placeholder="What is this project about? (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d0d0f] resize-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createProject.mutate()}
                disabled={!name.trim() || createProject.isPending}
                className="flex-1 bg-[#0d0d0f] hover:bg-[#0d0d0f]/90 text-white"
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}