import { useState, useEffect } from 'react'
import { api, type AppStatus } from '@/lib/api'

export function useAppStatuses(): AppStatus[] {
    const [statuses, setStatuses] = useState<AppStatus[]>([])

    useEffect(() => {
        let cancelled = false

        async function poll() {
            try {
                const s = await api.getAppStatuses()
                if (!cancelled) setStatuses(s)
            } catch {}
        }

        poll()
        const id = setInterval(poll, 800)
        return () => {
            cancelled = true
            clearInterval(id)
        }
    }, [])

    return statuses
}
