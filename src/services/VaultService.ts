import { VaultRepository, VaultReminderRepository } from '@/repositories/VaultRepository'
import type { VaultDocument, VaultDocumentType } from '@/types/entities'

export const VaultService = {
  async getVaultDocuments() {
    return VaultRepository.getAll()
  },

  async getDocumentsByType(type: VaultDocumentType) {
    return VaultRepository.getByType(type)
  },

  async searchDocuments(query: string) {
    if (!query.trim()) return VaultRepository.getAll()
    return VaultRepository.search(query.trim())
  },

  async getExpiringSoon() {
    return VaultRepository.getExpiringSoon(30)
  },

  async getStats() {
    return VaultRepository.getStats()
  },

  async saveDocument(data: {
    title: string
    type: VaultDocumentType
    description?: string
    tags?: string[]
    documentDate: string
    expiryDate?: string | null
    fileData: string
    fileName: string
    fileType: string
    fileSize: number
    thumbnailData?: string | null
    notes?: string
  }): Promise<VaultDocument> {
    const doc = await VaultRepository.create({
      title: data.title,
      type: data.type,
      description: data.description ?? '',
      tags: data.tags ?? [],
      documentDate: data.documentDate,
      expiryDate: data.expiryDate ?? null,
      fileData: data.fileData,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      thumbnailData: data.thumbnailData ?? null,
      isFavorite: false,
      notes: data.notes ?? '',
    })

    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate)
      const reminderDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (reminderDate > new Date()) {
        await VaultReminderRepository.create({
          documentId: doc.id,
          title: `${data.title} expires soon`,
          reminderDate: reminderDate.toISOString(),
          daysBefore: 7,
          isRead: false,
        })
      }
    }

    return doc
  },

  async updateDocument(
    id: string,
    data: {
      title?: string
      type?: VaultDocumentType
      description?: string
      tags?: string[]
      documentDate?: string
      expiryDate?: string | null
      notes?: string
    }
  ) {
    return VaultRepository.update(id, data)
  },

  async toggleFavorite(id: string) {
    const doc = await VaultRepository.getById(id)
    if (!doc) throw new Error('Document not found')
    return VaultRepository.update(id, { isFavorite: !doc.isFavorite })
  },

  async deleteDocument(id: string) {
    await VaultRepository.delete(id)
  },

  async getAlerts(): Promise<
    { id: string; message: string; severity: 'warning' | 'info'; documentId: string }[]
  > {
    const alerts: {
      id: string
      message: string
      severity: 'warning' | 'info'
      documentId: string
    }[] = []
    const expired = await VaultRepository.getExpired()

    for (const doc of expired) {
      alerts.push({
        id: `vault-expired-${doc.id}`,
        message: `"${doc.title}" has expired — review or archive it`,
        severity: 'warning',
        documentId: doc.id,
      })
    }

    const expiringSoon = await VaultRepository.getExpiringSoon(14)
    for (const doc of expiringSoon) {
      if (doc.expiryDate) {
        const daysLeft = Math.ceil(
          (new Date(doc.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        )
        alerts.push({
          id: `vault-expiring-${doc.id}`,
          message: `"${doc.title}" expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
          severity: 'info',
          documentId: doc.id,
        })
      }
    }

    return alerts
  },
}
