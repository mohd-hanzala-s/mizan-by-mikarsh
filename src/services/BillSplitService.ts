import { BillSplitRepository } from '@/repositories/BillSplitRepository'
import type { BillSplit } from '@/types/entities'

export interface CreateBillSplitInput {
  description: string
  totalAmount: number
  /** The people who owe the payer a share — not including the payer
   * themselves (the app's single user). A bill split N ways total means
   * N-1 names here plus the payer's own implicit share. */
  participantNames: string[]
  transactionId?: string | null
  date?: string
  notes?: string
}

export interface BillSplitSummary {
  totalAmount: number
  /** Sum of every participant's share — always ≤ totalAmount, since the
   * payer's own share is never in `participants`. */
  totalOwed: number
  totalSettled: number
  totalOutstanding: number
}

function validate(
  input: Pick<CreateBillSplitInput, 'description' | 'totalAmount' | 'participantNames'>
): string[] {
  if (!input.description.trim()) throw new Error('Description is required.')
  if (!(input.totalAmount > 0)) throw new Error('Total amount must be greater than 0.')
  const names = input.participantNames.map((n) => n.trim()).filter(Boolean)
  if (names.length === 0) {
    throw new Error('Add at least one other person to split this with.')
  }
  return names
}

/**
 * Splits `totalAmount` evenly across the payer + every named participant
 * (so N names = N+1-way split), rounding down to whole rupees and handing
 * the leftover rupee(s) to the first few participants in order — a
 * standard fair-rounding approach so the shares always sum to no more
 * than `totalAmount` minus the payer's own share, never over.
 */
export function splitEqually(
  totalAmount: number,
  participantNames: string[]
): { name: string; shareAmount: number }[] {
  const totalPeople = participantNames.length + 1
  const baseShare = Math.floor(totalAmount / totalPeople)
  const remainder = totalAmount - baseShare * totalPeople
  return participantNames.map((name, i) => ({
    name,
    shareAmount: baseShare + (i < remainder ? 1 : 0),
  }))
}

export function computeSummary(split: BillSplit): BillSplitSummary {
  const totalOwed = split.participants.reduce((sum, p) => sum + p.shareAmount, 0)
  const totalSettled = split.participants
    .filter((p) => p.isSettled)
    .reduce((sum, p) => sum + p.shareAmount, 0)
  return {
    totalAmount: split.totalAmount,
    totalOwed,
    totalSettled,
    totalOutstanding: totalOwed - totalSettled,
  }
}

export const BillSplitService = {
  async create(input: CreateBillSplitInput): Promise<BillSplit> {
    const names = validate(input)
    const shares = splitEqually(input.totalAmount, names)
    const now = new Date().toISOString()
    const split: BillSplit = {
      id: crypto.randomUUID(),
      description: input.description.trim(),
      totalAmount: input.totalAmount,
      transactionId: input.transactionId ?? null,
      participants: shares.map((s) => ({
        id: crypto.randomUUID(),
        name: s.name,
        shareAmount: s.shareAmount,
        isSettled: false,
        settledAt: null,
      })),
      date: input.date ?? now.slice(0, 10),
      notes: input.notes?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    }
    await BillSplitRepository.add(split)
    return split
  },

  /** Toggles one participant's settled state — the common action (they
   * paid you back, or you're undoing a mis-tap), so it's its own method
   * rather than requiring a full participants-array patch from the UI. */
  async toggleSettled(splitId: string, participantId: string): Promise<void> {
    const split = await BillSplitRepository.getById(splitId)
    if (!split) throw new Error('Split not found.')
    const participants = split.participants.map((p) =>
      p.id === participantId
        ? {
            ...p,
            isSettled: !p.isSettled,
            settledAt: !p.isSettled ? new Date().toISOString() : null,
          }
        : p
    )
    await BillSplitRepository.update(splitId, { participants })
  },

  async delete(id: string): Promise<void> {
    await BillSplitRepository.delete(id)
  },

  splitEqually,
  computeSummary,
}
