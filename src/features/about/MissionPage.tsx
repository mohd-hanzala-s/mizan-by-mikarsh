import { ArrowLeft, Scale, Eye, Gem, Lock, Layout, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MissionPageProps {
  onBack?: () => void
}

interface Value {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  label: string
  description: string
}

const VALUES: Value[] = [
  {
    icon: Scale,
    label: 'Balance',
    description: 'We design for equilibrium — between power and simplicity, depth and clarity, control and ease.',
  },
  {
    icon: Lock,
    label: 'Privacy',
    description: 'Your financial life belongs to you alone. Every design decision starts with this commitment.',
  },
  {
    icon: Layout,
    label: 'Simplicity',
    description: 'Complexity is easy. Removing it without losing capability is art. We chase that art every day.',
  },
  {
    icon: ShieldCheck,
    label: 'Trust',
    description: 'We earn trust through transparency, not through promises. You can see exactly how your data is handled.',
  },
  {
    icon: Gem,
    label: 'Longevity',
    description: 'We build for decades, not quarters. Mizan is designed to grow with you, not to chase trends.',
  },
]

export function MissionPage({ onBack }: MissionPageProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-20 pb-16 pt-32 md:px-32">
        <button
          type="button"
          onClick={() => onBack ? onBack() : navigate('/about')}
          className="mb-20 flex size-40 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:shadow-glass-sm transition-all duration-fast"
          aria-label="Back to About"
        >
          <ArrowLeft className="size-20" aria-hidden="true" />
        </button>
        <h1 className="text-display text-text-primary">Mission & Vision</h1>
      </div>

      <div className="flex flex-col gap-20 px-20 pb-32 md:px-32">
        <section className="card rounded-2xl p-20 md:p-28">
          <div className="mb-12 flex items-center gap-10">
            <Eye className="size-24 text-accent" aria-hidden="true" />
            <h2 className="text-h2 text-text-primary">Mission</h2>
          </div>
          <p className="text-body-lg leading-relaxed text-text-secondary">
            To give every person a beautiful, private, and powerful tool for
            mastering their financial life — without compromising their data,
            their attention, or their peace of mind.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <div className="mb-12 flex items-center gap-10">
            <Eye className="size-24 text-accent" aria-hidden="true" />
            <h2 className="text-h2 text-text-primary">Vision</h2>
          </div>
          <p className="text-body-lg leading-relaxed text-text-secondary">
            A world where managing money feels effortless and empowering —
            where financial clarity is accessible to everyone, not just those
            who can afford premium services or sacrifice their privacy.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-16 text-h2 text-text-primary">Our Values</h2>
          <div className="flex flex-col gap-12">
            {VALUES.map(({ icon: Icon, label, description }) => (
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
          <h2 className="mb-12 text-h2 text-text-primary">The M I K A R S H Design Language</h2>
          <p className="text-body-lg leading-relaxed text-text-secondary">
            Beautiful craftsmanship meets intentional restraint. Our design
            language draws from the clarity of Apple, the precision of Linear,
            and a touch of soft depth that makes every interaction feel warm and
            human. Deep Emerald Green signals trust and growth, while Gold
            accents mark moments of insight and achievement. Every pixel, every
            animation, every spacing decision is deliberate — because beauty and
            usability are not separate goals.
          </p>
        </section>
      </div>
    </div>
  )
}
