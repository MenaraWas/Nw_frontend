'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { LogOut, ChevronLeft } from 'lucide-react'

interface NavbarProps {
  showBack?: boolean
  backHref?: string
  title?: string
}

export default function Navbar({ showBack, backHref = '/dashboard', title }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0d0d0f] border-b border-white/10 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.push(backHref)}
              className="text-white/60 hover:text-white flex items-center gap-1 text-sm transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          {showBack && <span className="text-white/20">|</span>}
          <span className="text-white font-semibold text-lg tracking-tight">
            {title || 'NodeWave'}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-white/50 text-xs">
                {user.role}{user.department ? ` · ${user.department}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}