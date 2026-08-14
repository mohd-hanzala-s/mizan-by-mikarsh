import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Vault,
  ScanLine,
  ReceiptText,
  ShieldCheck,
  CalendarDays,
  Lightbulb,
  Tags,
  Search,
  HardDriveDownload,
  FileUp,
} from 'lucide-react'

interface FeaturesPageProps {
  onBack?: () => void
}

interface Feature {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Vault,
    title: 'Digital Vault',
    description:
      'Securely store important documents, receipts, warranties, and financial records in one organized space.',
  },
  {
    icon: ScanLine,
    title: 'OCR Receipt Scanner',
    description:
      'Snap a photo of any receipt and Mizan extracts the merchant, amount, date, and category automatically.',
  },
  {
    icon: ReceiptText,
    title: 'Bills & Warranty Tracking',
    description:
      'Never miss a due date or lose a warranty again. Track upcoming bills and warranty expirations with smart reminders.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance Management',
    description:
      'Keep all your insurance policies organized — health, life, vehicle, property — with renewal alerts and coverage summaries.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar & Reminders',
    description:
      'Visualize your financial commitments on a calendar. Set reminders for bills, renewals, and important dates.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description:
      'Understand your spending patterns with intelligent insights that surface trends, anomalies, and opportunities to save.',
  },
  {
    icon: Tags,
    title: 'Categories & Tags',
    description:
      'Organize transactions your way with customizable categories and multi-label tags for detailed filtering.',
  },
  {
    icon: Search,
    title: 'Search Everything',
    description:
      'Instant full-text search across all your transactions, documents, notes, and tags — find anything in seconds.',
  },
  {
    icon: HardDriveDownload,
    title: 'Local Backup & Restore',
    description:
      'Create encrypted backups of your entire financial database and restore them whenever you need.',
  },
  {
    icon: FileUp,
    title: 'Import & Export',
    description:
      'Import transactions from CSV files or bank exports. Export your data in standard formats for full portability.',
  },
]

export function FeaturesPage({ onBack }: FeaturesPageProps) {
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
        <h1 className="text-display text-text-primary">Features</h1>
        <p className="mt-8 text-body-lg text-text-secondary">
          Everything you need to master your finances, all in one place.
        </p>
      </div>

      <div className="px-20 pb-32 md:px-32">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card-sm rounded-2xl flex flex-col gap-8 p-20">
              <div className="flex size-40 items-center justify-center rounded-xl bg-brand-teal900/8">
                <Icon className="size-20 text-brand-teal900" aria-hidden="true" />
              </div>
              <h3 className="text-h3 text-text-primary">{title}</h3>
              <p className="text-body-sm text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
