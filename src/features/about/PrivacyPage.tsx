import { ArrowLeft, ShieldCheck, WifiOff, EyeOff, Ban, UserCheck, CloudOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PrivacyPageProps {
  onBack?: () => void
}

interface Guarantee {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  title: string
  description: string
}

const GUARANTEES: Guarantee[] = [
  {
    icon: ShieldCheck,
    title: 'Everything Stays on Your Device',
    description: 'Your financial data lives in a local database on your phone or computer. We never upload it to our servers because we have no servers for your data.',
  },
  {
    icon: CloudOff,
    title: 'No Uploads, Ever',
    description: 'Mizan works fully offline. There is no backend, no cloud sync engine, and no data pipeline collecting your information behind the scenes.',
  },
  {
    icon: EyeOff,
    title: 'No Tracking',
    description: 'We do not use analytics SDKs, tracking pixels, or behavioral monitoring. We have no idea how you use Mizan — and we prefer it that way.',
  },
  {
    icon: Ban,
    title: 'No Ads, No Data Brokering',
    description: 'Mizan will never show you an advertisement or sell your attention. Our business model is simple: you either use the app for free or choose to support us directly.',
  },
  {
    icon: UserCheck,
    title: 'No Mandatory Login',
    description: 'You do not need an account to use Mizan. There is no sign-up wall, no email verification, no phone number required. Open the app and start managing your money.',
  },
]

export function PrivacyPage({ onBack }: PrivacyPageProps) {
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
        <h1 className="text-display text-text-primary">Privacy First</h1>
        <p className="mt-8 text-body-lg text-text-secondary">
          Your financial life is yours. We have built Mizan to prove that
          powerful software does not require surveillance.
        </p>
      </div>

      <div className="flex flex-col gap-20 px-20 pb-32 md:px-32">
        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-16 text-h2 text-text-primary">Privacy by Default</h2>
          <p className="text-body leading-relaxed text-text-secondary">
            Most apps treat privacy as an afterthought — something you can
            configure in settings if you dig deep enough. We treat it as the
            starting point. Every feature in Mizan begins with the question:
            does this compromise the user&apos;s privacy? If the answer is yes,
            we find another way.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-16 text-h2 text-text-primary">Our Guarantees</h2>
          <div className="flex flex-col gap-14">
            {GUARANTEES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-12">
                <div className="mt-1 flex size-36 shrink-0 items-center justify-center rounded-lg bg-accent-muted">
                  <Icon className="size-18 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-body font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <div className="mb-12 flex items-center gap-10">
            <WifiOff className="size-24 text-accent" aria-hidden="true" />
            <h2 className="text-h2 text-text-primary">Offline First</h2>
          </div>
          <p className="text-body leading-relaxed text-text-secondary">
            Mizan is designed to work entirely offline. Your data is stored in a
            local database on your device. Every calculation, every report, every
            chart is generated locally. This means Mizan works in airplane mode,
            underground, or anywhere without a connection — and your data never
            leaves your device in the process.
          </p>
        </section>

        <section className="card rounded-2xl p-20 md:p-28">
          <h2 className="mb-12 text-h2 text-text-primary">Future Cloud Backup</h2>
          <p className="text-body leading-relaxed text-text-secondary">
            We understand that backing up your data is important. If and when
            we introduce cloud backup in the future, it will be entirely
            optional, end-to-end encrypted, and opt-in by default. You will
            never be forced to upload your data, and the app will never do so
            without your explicit permission. Even then, the local-first
            experience will remain the default.
          </p>
        </section>
      </div>
    </div>
  )
}
