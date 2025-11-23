import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Search,
  Bookmark,
  User,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
  { icon: Search, label: 'Opportunities', path: '/dashboard', id: 'opportunities' },
  { icon: Bookmark, label: 'Saved', path: '/saved', id: 'saved' },
]

const bottomNavItems = [
  { icon: User, label: 'Profile', path: '/profile', id: 'profile' },
  { icon: Settings, label: 'Settings', path: '/settings', id: 'settings' },
]

export function Sidebar({ onLogout, className }) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col sticky top-0 h-screen border-r bg-background/80 backdrop-blur-sm transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-6 flex items-center gap-3 border-b">
        {!isCollapsed && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">Funding Finder</div>
            <div className="text-xs text-muted-foreground truncate">Smart Opportunities</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link key={item.id} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2 h-10',
                    isCollapsed && 'justify-center px-0'
                  )}
                  size="sm"
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
          <Separator className="my-2" />
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link key={item.id} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2 h-10',
                    isCollapsed && 'justify-center px-0'
                  )}
                  size="sm"
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          className={cn('w-full justify-center gap-2', isCollapsed && 'px-0')}
          onClick={onLogout}
          size="sm"
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

