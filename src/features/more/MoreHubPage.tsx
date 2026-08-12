import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Lightbulb,
  User,
  Bell,
  Info,
  Vault,
  Upload,
  Database,
  Shield,
  Sparkles,
  Scale,
  Zap,
  BrainCircuit,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface LinkTile {
  id: string
  label: string
  description: string
  path: string
  icon: typeof Settings
  external?: boolean
}

const LINKS: LinkTile[] = [
  {
    id: 'settings',
    label: 'Settings',
    description: 'Preferences, categories, and app configuration',
    path: '/settings',
    icon: Settings,
  },
  {
    id: 'command',
    label: 'AI Command Center',
    description: 'Ask anything about your money in natural language',
    path: '/command',
    icon: Zap,
  },
  {
    id: 'alerts',
    label: 'Smart Automation',
    description: 'Auto-detected insights, duplicates, and savings tips',
    path: '/alerts',
    icon: BrainCircuit,
  },
  {
    id: 'insights',
    label: 'Insights & Reports',
    description: 'Recommendations, analytics, and financial reports',
    path: '/insights',
    icon: Lightbulb,
  },
  {
    id: 'profile',
    label: 'Financial Identity',
    description: 'Profile, salary, tax bracket, and financial picture',
    path: '/profile',
    icon: User,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts, reminders, and activity updates',
    path: '/notifications',
    icon: Bell,
  },
  {
    id: 'vault',
    label: 'Document Vault',
    description: 'Statements, policies, agreements, and files',
    path: '/vault',
    icon: Vault,
  },
  {
    id: 'about',
    label: 'About',
    description: 'Mizan story, mission, features, and FAQ',
    path: '/about',
    icon: Info,
  },
  {
    id: 'backup',
    label: 'Backup & Restore',
    description: 'Export your data or restore from a backup',
    path: '/settings',
    icon: Database,
  },
  {
    id: 'import',
    label: 'Import Data',
    description: 'Bring in transactions from bank statements',
    path: '/settings',
    icon: Upload,
  },
]

export function MoreHubPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-20 p-16 md:p-24">
      <div>
        <h1 className="font-heading text-h2 font-bold text-text-primary tracking-tight">More</h1>
        <p className="text-body-sm text-text-tertiary mt-4">Settings, tools, and resources</p>
      </div>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center gap-10">
          <div className="card-sm flex size-36 shrink-0 items-center justify-center">
            <Scale className="size-18 text-brand-teal900" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-body font-semibold text-text-primary">Mizan Finance</p>
            <p className="text-caption text-text-tertiary mt-2">v2.0 — Local-first, private by design</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        {LINKS.map(({ id, label, description, path, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={cn(
              'flex items-start gap-12 rounded-2xl border border-border/40 p-16 text-left transition-all duration-fast',
              'hover:bg-brand-teal900/5 hover:border-brand-teal900/20 active:scale-[0.98]'
            )}
          >
            <span className="flex size-40 shrink-0 items-center justify-center rounded-xl bg-brand-teal900/8 text-accent">
              <Icon className="size-20" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary">{label}</p>
              <p className="text-caption text-text-tertiary mt-2 leading-relaxed">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <section className="card flex flex-col items-center gap-12 p-20">
        <div className="flex items-center gap-8">
          <Shield className="size-16 text-brand-teal400" aria-hidden="true" />
          <Sparkles className="size-16 text-gold-500" aria-hidden="true" />
        </div>
        <p className="text-body-sm text-text-secondary text-center max-w-[320px]">
          Your data stays on your device. Mizan is fully offline and never sends your financial information anywhere.
        </p>
      </section>
    </div>
  )
}
