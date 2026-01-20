import { useState, useEffect } from 'react'

export function useHashRoute(defaultHash) {
    const cleanDefault = defaultHash.replace(/^#/, '')
    const getCleanHash = () => window.location.hash.replace(/^#/, '') || cleanDefault

    const [hash, setHash] = useState(getCleanHash())

    useEffect(() => {
        const handler = () => setHash(getCleanHash())
        window.addEventListener('hashchange', handler)
        if (!window.location.hash) window.location.hash = cleanDefault
        return () => window.removeEventListener('hashchange', handler)
    }, [cleanDefault])

    return [hash, (next) => (window.location.hash = next)]
}
