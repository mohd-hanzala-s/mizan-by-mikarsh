import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BrandStoryPageProps {
  onBack?: () => void
}

export function BrandStoryPage({ onBack }: BrandStoryPageProps) {
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
        <h1 className="text-display text-text-primary">Our Story</h1>
      </div>

      <div className="flex flex-col gap-20 px-20 pb-32 md:px-32">
        <section className="card rounded-2xl p-20 md:p-28">
          <p className="text-body-lg leading-relaxed text-text-primary">
            Mizan was born from a simple belief: personal finance should feel calm, not chaotic. In
            a world of bloated apps, hidden fees, and data-hungry platforms, we set out to build
            something different — a finance tool that respects your privacy, your time, and your
            intelligence.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="text-h2 text-text-primary">The Name</h2>
          <p className="mt-12 text-body-lg leading-relaxed text-text-secondary">
            Mizan is an Arabic word meaning{' '}
            <em className="text-text-primary not-italic font-medium">balance</em>. It represents
            equilibrium — between earning and spending, planning and living, saving and enjoying.
            Just as a scale finds its center, Mizan helps you find yours.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="text-h2 text-text-primary">Why It Matters</h2>
          <p className="mt-12 text-body-lg leading-relaxed text-text-secondary">
            Money touches every corner of our lives — the home we live in, the food we share, the
            dreams we chase. Yet most financial tools treat it as a spreadsheet problem. We believe
            managing money should be an act of self-care, not a source of anxiety. Mizan is designed
            to bring clarity, not complexity; calm, not clutter.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="text-h2 text-text-primary">Built Differently</h2>
          <p className="mt-12 text-body-lg leading-relaxed text-text-secondary">
            From day one, we committed to three principles that define everything we build: your
            data stays on your device, your experience stays free of advertising, and your
            relationship with money stays in your hands. No cloud lock-in. No surveillance. Just a
            beautiful, capable tool that earns its place on your home screen.
          </p>
        </section>
      </div>
    </div>
  )
}
