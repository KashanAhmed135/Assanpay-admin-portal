import { useEffect, useState } from 'react'
import { STORAGE_KEY } from '../config/superAdminConfig'
import { createMerchantId } from '../utils/merchantValidation'
import { fetchAdminMerchants } from '../api/adminApi'

export function useMerchantStorage() {
    const [merchants, setMerchants] = useState([])
    const [loadError, setLoadError] = useState('')

    const mapApiRows = (rows) => rows.map((m) => ({
        id: m.merchantId,
        mid: String(m.merchantId ?? ''),
        business_name: m.businessName || '',
        legal_name: m.legalName || '',
        legal_email: m.legalEmail || m.legal_email || m.email || '',
        business_email: m.legalEmail || m.legal_email || m.email || '',
        business_phone: 'â€”',
        admin_name: '',
        username: '',
        admin_email: '',
        status: m.blocked ? 'blocked' : 'active',
        environment: (m.environment || '').toUpperCase() || 'TEST',
        settlement_mode: m.settlementMode,
        settlement_interval: m.settlementInterval,
        created_at: m.createdAt,
    }))

    useEffect(() => {
        let active = true

        const loadFromStorage = () => {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return

            try {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    const normalized = parsed.map((m) => {
                        const id = m.id || createMerchantId()
                        const mid = m.mid || m.merchant_id || m.merchantId || id
                        return {
                            ...m,
                            id,
                            mid,
                            status: m.status || 'active',
                        }
                    })
                    if (active) {
                        setMerchants(normalized)
                    }
                }
            } catch {
                // ignore bad localStorage data
            }
        }

        const loadFromApi = async () => {
            try {
                const page = await fetchAdminMerchants({ page: 0, size: 200 })
                const rows = Array.isArray(page?.content) ? page.content : []
                const mapped = mapApiRows(rows)
                if (active) {
                    setMerchants(mapped)
                    setLoadError('')
                }
            } catch {
                if (active) {
                    setLoadError('API not reachable, showing demo data.')
                }
                loadFromStorage()
            }
        }

        loadFromApi()
        return () => {
            active = false
        }
    }, [])

    const persistMerchants = (next) => {
        setMerchants(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }

    const updateMerchantStatus = (merchantId, status) => {
        const next = merchants.map((m) => (m.id === merchantId ? { ...m, status } : m))
        persistMerchants(next)
    }

    const saveMerchant = (merchantData, editingMerchant) => {
        const next = editingMerchant
            ? merchants.map((m) => (m.id === editingMerchant.id ? merchantData : m))
            : [merchantData, ...merchants]
        persistMerchants(next)
    }

    const reloadMerchants = async () => {
        try {
            const page = await fetchAdminMerchants({ page: 0, size: 200 })
            const rows = Array.isArray(page?.content) ? page.content : []
            const mapped = mapApiRows(rows)
            setMerchants(mapped)
            setLoadError('')
        } catch {
            setLoadError('API not reachable, showing demo data.')
        }
    }

    return {
        merchants,
        persistMerchants,
        updateMerchantStatus,
        saveMerchant,
        reloadMerchants,
        loadError,
    }
}


