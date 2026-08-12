import { db } from '@/database/db'
import type { VaultDocument, VaultReminder, VaultDocumentType } from '@/types/entities'

function generateId(): string {
  return crypto.randomUUID()
}

export const VaultRepository = {
  async getAll(): Promise<VaultDocument[]> {
    return db.vault_documents.orderBy('documentDate').reverse().toArray()
  },

  async getById(id: string): Promise<VaultDocument | undefined> {
    return db.vault_documents.get(id)
  },

  async getByType(type: VaultDocumentType): Promise<VaultDocument[]> {
    return db.vault_documents.where('type').equals(type).reverse().sortBy('documentDate')
  },

  async getExpiringSoon(daysThreshold = 30): Promise<VaultDocument[]> {
    const now = new Date()
    const cutoff = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000).toISOString()
    return db.vault_documents
      .filter((d) => d.expiryDate !== null && d.expiryDate <= cutoff && d.expiryDate >= now.toISOString())
      .toArray()
  },

  async getExpired(): Promise<VaultDocument[]> {
    const now = new Date().toISOString()
    return db.vault_documents
      .filter((d) => d.expiryDate !== null && d.expiryDate < now)
      .toArray()
  },

  async getFavorites(): Promise<VaultDocument[]> {
    return db.vault_documents.filter((d) => d.isFavorite).toArray()
  },

  async search(query: string): Promise<VaultDocument[]> {
    const q = query.toLowerCase()
    return db.vault_documents
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.notes.toLowerCase().includes(q)
      )
      .toArray()
  },

  async create(data: Omit<VaultDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaultDocument> {
    const now = new Date().toISOString()
    const doc: VaultDocument = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await db.vault_documents.add(doc)
    return doc
  },

  async update(
    id: string,
    data: Partial<Omit<VaultDocument, 'id' | 'createdAt'>>
  ): Promise<VaultDocument> {
    const existing = await db.vault_documents.get(id)
    if (!existing) throw new Error(`Document ${id} not found`)
    const updated: VaultDocument = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    }
    await db.vault_documents.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.vault_documents.delete(id)
    await db.vault_reminders.where('documentId').equals(id).delete()
  },

  async getStats(): Promise<{
    total: number
    byType: Record<VaultDocumentType, number>
    expiringSoon: number
    expired: number
    totalSize: number
  }> {
    const all = await this.getAll()
    const byType: Record<string, number> = {} as Record<string, number>
    let totalSize = 0
    let expiringSoon = 0
    let expired = 0
    const now = new Date().toISOString()
    const cutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    for (const doc of all) {
      byType[doc.type] = (byType[doc.type] || 0) + 1
      totalSize += doc.fileSize
      if (doc.expiryDate) {
        if (doc.expiryDate < now) expired++
        else if (doc.expiryDate <= cutoff) expiringSoon++
      }
    }

    return {
      total: all.length,
      byType: byType as Record<VaultDocumentType, number>,
      expiringSoon,
      expired,
      totalSize,
    }
  },
}

export const VaultReminderRepository = {
  async getByDocument(documentId: string): Promise<VaultReminder[]> {
    return db.vault_reminders.where('documentId').equals(documentId).toArray()
  },

  async getUpcoming(): Promise<VaultReminder[]> {
    return db.vault_reminders
      .filter((r) => !r.isRead && r.reminderDate >= new Date().toISOString())
      .toArray()
  },

  async create(data: Omit<VaultReminder, 'id' | 'createdAt'>): Promise<VaultReminder> {
    const reminder: VaultReminder = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.vault_reminders.add(reminder)
    return reminder
  },

  async markRead(id: string): Promise<void> {
    await db.vault_reminders.update(id, { isRead: true })
  },

  async deleteByDocument(documentId: string): Promise<void> {
    await db.vault_reminders.where('documentId').equals(documentId).delete()
  },
}
