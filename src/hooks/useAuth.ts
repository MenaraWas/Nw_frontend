import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Role } from '@/types'

export function useAuth(requiredRole?: Role | Role[]) {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) return

    if (!user) {
      router.push('/login')
      return
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(user.role)) {
        router.push('/dashboard')
      }
    }
  }, [user, isInitialized, router, requiredRole])

  return { user, isInitialized }
}