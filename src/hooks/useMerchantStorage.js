import { useEffect, useState } from 'react'
import { STORAGE_KEY } from '../config/superAdminConfig'
import { createMerchantId } from '../utils/merchantValidation'

export function useMerchantStorage() {
    const [merchants, setMerchants] = useState([])

    useEffect(() => {
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
                setMerchants(normalized)

                const changed = normalized.some(
                    (m, i) => m.id !== parsed[i]?.id || m.status !== (parsed[i]?.status || 'active')
                )
                if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
            }
        } catch {
            // ignore bad localStorage data
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

    return {
        merchants,
        persistMerchants,
        updateMerchantStatus,
        saveMerchant,
    }
}
