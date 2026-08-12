import { useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface FAQPageProps {
  onBack?: () => void
}

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Is my financial data private?',
    answer:
      'Absolutely. All your data is stored locally on your device. Mizan does not upload your financial information to any server. We have no access to your data, and we do not use analytics or tracking of any kind.',
  },
  {
    question: 'Can I use Mizan offline?',
    answer:
      'Yes. Mizan is designed to work fully offline. Every feature — including transaction entry, reporting, search, and backup — works without an internet connection. Your data is stored in a local database on your device.',
  },
  {
    question: 'How do I back up my data?',
    answer:
      'You can create encrypted local backups from the Settings screen. These backups contain your full database and can be restored on any device running Mizan. In the future, we may offer optional end-to-end encrypted cloud backup — but it will always be opt-in.',
  },
  {
    question: 'What document types can I store in the Digital Vault?',
    answer:
      'The Digital Vault supports common formats including PDF, JPEG, PNG, and HEIC. You can store receipts, warranties, insurance documents, contracts, ID documents, and any other files you want to keep organized alongside your finances.',
  },
  {
    question: 'What currencies does Mizan support?',
    answer:
      'Mizan supports over 150 currencies with proper formatting, symbols, and decimal handling for each. You can also manage multiple accounts in different currencies within the same app.',
  },
  {
    question: 'Which platforms is Mizan available on?',
    answer:
      'Mizan is available as a progressive web app (PWA) that works on iOS, Android, and desktop browsers. You can install it to your home screen for a native app experience on any device.',
  },
  {
    question: 'What is coming in future updates?',
    answer:
      'Our roadmap includes recurring transaction automation, investment portfolio tracking, multi-device sync (always end-to-end encrypted), family sharing, and deeper insights powered entirely on-device. Everything we build will remain true to our privacy-first philosophy.',
  },
]

function FAQAccordion({ question, answer }: FAQItem) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card-sm rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-12 p-16 text-left transition-all duration-fast"
      >
        <span className="text-body font-semibold text-text-primary pr-8">{question}</span>
        <ChevronDown
          className={cn(
            'size-20 shrink-0 text-text-tertiary transition-transform duration-standard',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-16 pb-16">
          <p className="text-body-sm text-text-secondary leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

export function FAQPage({ onBack }: FAQPageProps) {
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
        <h1 className="text-display text-text-primary">FAQ</h1>
        <p className="mt-8 text-body-lg text-text-secondary">
          Common questions about Mizan — answered clearly and honestly.
        </p>
      </div>

      <div className="flex flex-col gap-8 px-20 pb-32 md:px-32">
        {FAQ_ITEMS.map((item) => (
          <FAQAccordion key={item.question} {...item} />
        ))}
      </div>
    </div>
  )
}
