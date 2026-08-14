import {
  ReceiptText,
  FileText,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  Car,
  HeartPulse,
  Building2,
  FolderOpen,
} from 'lucide-react'
import type { VaultDocumentType } from '@/types/entities'

export const DOC_TYPE_META: Record<
  VaultDocumentType,
  {
    label: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
    color: string
  }
> = {
  receipt: { label: 'Receipt', icon: ReceiptText, color: 'text-income' },
  bill: { label: 'Bill', icon: FileText, color: 'text-expense' },
  warranty: { label: 'Warranty', icon: ShieldCheck, color: 'text-info' },
  insurance: { label: 'Insurance', icon: Shield, color: 'text-brand-teal900' },
  tax: { label: 'Tax', icon: FileSpreadsheet, color: 'text-liability' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'text-accent' },
  medical: { label: 'Medical', icon: HeartPulse, color: 'text-expense' },
  bank_statement: { label: 'Bank Statement', icon: Building2, color: 'text-brand-teal900' },
  other: { label: 'Other', icon: FolderOpen, color: 'text-tertiary' },
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

export function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
