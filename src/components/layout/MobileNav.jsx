import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Search, Bookmark, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
  { icon: Search, label: 'Search', path: '/dashboard', id: 'search' },
  { icon: Bookmark, label: 'Saved', path: '/saved', id: 'saved' },
  { icon: User, label: 'Profile', path: '/profile', id: 'profile' },
]

export function MobileNav({ className }) {
  const location = useLocation()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm md:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link key={item.id} to={item.path} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-1 h-full',
                  isActive && 'bg-accent'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span className={cn('text-xs', isActive && 'text-primary font-medium')}>
                  {item.label}
                </span>
              </Button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

