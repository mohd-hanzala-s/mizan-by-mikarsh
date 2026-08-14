import { ArrowLeft, Gem, Lock, Users, Layout, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MikarshPageProps {
  onBack?: () => void
}

interface Principle {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  label: string
  description: string
}

const PRINCIPLES: Principle[] = [
  {
    icon: Gem,
    label: 'Beautiful Craftsmanship',
    description:
      'Every surface, every interaction, every detail is considered. We believe great tools should also be beautiful objects.',
  },
  {
    icon: Lock,
    label: 'Privacy by Design',
    description:
      'Privacy is not a checkbox — it is the foundation. We build from the assumption that your data belongs to you alone.',
  },
  {
    icon: Users,
    label: 'Human-Centered Experiences',
    description:
      'Technology serves people, not the other way around. We design for how humans actually think, feel, and behave.',
  },
  {
    icon: Layout,
    label: 'Simplicity over Complexity',
    description:
      'The hardest thing a product can do is let go of unnecessary features. We choose restraint every time.',
  },
  {
    icon: ShieldCheck,
    label: 'Long-Term Reliability',
    description:
      'We build software that lasts. Our products are designed to be dependable companions for years, not disposable experiments.',
  },
]

interface Product {
  name: string
  domain: string
  description: string
  color: string
}

const PRODUCTS: Product[] = [
  {
    name: 'Mizan',
    domain: 'Finance',
    description:
      'Your personal finance companion. Track expenses, manage budgets, scan receipts, and find the balance that works for you — all with total privacy.',
    color: 'bg-brand-teal900',
  },
  {
    name: 'Naven',
    domain: 'Productivity',
    description:
      'Coming soon. A fresh approach to getting things done — designed for deep work, intentional planning, and sustainable momentum.',
    color: 'bg-accent',
  },
  {
    name: 'Louvina',
    domain: 'Lifestyle',
    description:
      'Coming soon. Daily tools for a well-lived life — from habit tracking to mindful routines, crafted with the same care as everything we make.',
    color: 'bg-brand-teal900/70',
  },
]

export function MikarshPage({ onBack }: MikarshPageProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-20 pb-16 pt-32 md:px-32">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate('/about'))}
          className="mb-20 flex size-40 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:shadow-glass-sm transition-all duration-fast"
          aria-label="Back to About"
        >
          <ArrowLeft className="size-20" aria-hidden="true" />
        </button>
        <h1 className="text-display text-text-primary">M I K A R S H</h1>
        <p className="mt-8 text-body-lg text-text-secondary">
          An independent studio building thoughtful software for everyday life.
        </p>
      </div>

      <div className="flex flex-col gap-20 px-20 pb-32 md:px-32">
        <section className="card rounded-2xl p-20 md:p-28">
          <p className="text-body-lg leading-relaxed text-text-secondary">
            M I K A R S H is a small, independent software studio dedicated to crafting tools that
            feel effortless, look beautiful, and respect the people who use them. We are not backed
            by venture capital. We are not chasing growth at any cost. We are guided by a single
            question: how can this be better for the person using it?
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-16 text-h2 text-text-primary">Our Principles</h2>
          <div className="flex flex-col gap-16">
            {PRINCIPLES.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex gap-12">
                <div className="mt-2 flex size-36 shrink-0 items-center justify-center rounded-lg bg-accent-muted">
                  <Icon className="size-18 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-h3 text-text-primary">{label}</h3>
                  <p className="mt-4 text-body-sm text-text-secondary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-16 text-h2 text-text-primary">Our Ecosystem</h2>
          <div className="flex flex-col gap-12">
            {PRODUCTS.map(({ name, domain, description, color }) => (
              <div key={name} className="card-sm rounded-xl p-16">
                <div className="flex items-center gap-10 mb-8">
                  <div className={`size-8 rounded ${color}`} aria-hidden="true" />
                  <span className="text-overline text-text-tertiary">{domain}</span>
                </div>
                <h3 className="text-h3 text-text-primary">{name}</h3>
                <p className="mt-6 text-body-sm text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card rounded-2xl p-20 md:p-28 text-center">
          <p className="text-body text-text-secondary italic">
            Built for the long term. Not for the next funding round.
          </p>
        </section>
      </div>
    </div>
  )
}
