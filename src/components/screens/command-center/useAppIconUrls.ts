import { useEffect, useState } from 'react'
import { api, type ManagedApp } from '@/lib/api'

export function useAppIconUrls(apps: ManagedApp[]) {
    const [iconUrls, setIconUrls] = useState<Record<string, string | undefined>>({})

    useEffect(() => {
        if (typeof api.extractIcon !== 'function') return

        let cancelled = false

        apps.forEach((app) => {
            api.extractIcon(app.exe_path)
                .then((b64) => {
                    if (cancelled) return
                    setIconUrls((prev) => ({
                        ...prev,
                        [app.id]: b64 ? `data:image/png;base64,${b64}` : undefined,
                    }))
                })
                .catch(() => {})
        })

        return () => {
            cancelled = true
        }
    }, [apps])

    return iconUrls
}
