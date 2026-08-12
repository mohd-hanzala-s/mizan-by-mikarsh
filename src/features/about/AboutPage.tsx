import { useState } from 'react'
import {
  BookOpen,
  Heart,
  Shield,
  Sparkles,
  Building2,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { BrandStoryPage } from './BrandStoryPage'
import { MissionPage } from './MissionPage'
import { MikarshPage } from './MikarshPage'
import { PrivacyPage } from './PrivacyPage'
import { FeaturesPage } from './FeaturesPage'
import { FAQPage } from './FAQPage'

type SubPage = 'story' | 'mission' | 'mikarsh' | 'privacy' | 'features' | 'faq' | null

interface SectionCard {
  id: SubPage
  label: string
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
}

const SECTIONS: SectionCard[] = [
  {
    id: 'story',
    label: 'Our Story',
    description: 'The philosophy and journey behind Mizan',
    icon: BookOpen,
  },
  {
    id: 'mission',
    label: 'Mission & Vision',
    description: 'What drives us and where we are headed',
    icon: Heart,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Your data, your device, your control',
    icon: Shield,
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Everything Mizan can do for your finances',
    icon: Sparkles,
  },
  {
    id: 'mikarsh',
    label: 'M I K A R S H',
    description: 'The studio behind Mizan and our ecosystem',
    icon: Building2,
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Common questions, clear answers',
    icon: HelpCircle,
  },
]

export function AboutPage() {
  const [page, setPage] = useState<SubPage>(null)

  if (page === 'story') return <BrandStoryPage onBack={() => setPage(null)} />
  if (page === 'mission') return <MissionPage onBack={() => setPage(null)} />
  if (page === 'mikarsh') return <MikarshPage onBack={() => setPage(null)} />
  if (page === 'privacy') return <PrivacyPage onBack={() => setPage(null)} />
  if (page === 'features') return <FeaturesPage onBack={() => setPage(null)} />
  if (page === 'faq') return <FAQPage onBack={() => setPage(null)} />

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-20 pb-24 pt-32 md:px-32">
        <h1 className="text-display text-text-primary">About Mizan</h1>
        <p className="mt-4 text-body text-text-secondary">by M I K A R S H</p>
        <p className="mt-12 text-h3 font-medium text-brand-teal900">
          Master Your Money. Live in Balance.
        </p>
      </div>

      <div className="flex flex-col gap-12 px-20 pb-32 md:px-32">
        {SECTIONS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id)}
            className="card rounded-2xl flex items-center gap-14 p-20 text-left transition-all duration-fast hover:shadow-glass-lg active:scale-[0.98]"
          >
            <div className="flex size-48 shrink-0 items-center justify-center rounded-xl bg-accent-muted">
              <Icon className="size-24 text-accent" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-h3 text-text-primary truncate">{label}</h3>
              <p className="mt-2 text-body-sm text-text-secondary">{description}</p>
            </div>
            <ChevronRight className="size-20 shrink-0 text-text-tertiary" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="mt-auto px-20 pb-32 pt-12 text-center md:px-32">
        <p className="text-caption text-text-tertiary">Mizan v1.0.0</p>
        <p className="mt-4 text-caption text-text-tertiary">
          Made with care by M I K A R S H
        </p>
      </div>
    </div>
  )
}
