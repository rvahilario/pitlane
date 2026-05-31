import { useEffect, useState } from 'react'
import { api, type ManagedApp } from '@/lib/api'

const iconUrlCache = new Map<string, string>()
const pendingFetches = new Map<string, Promise<string | undefined>>()

export function resetAppIconUrlCacheForTests() {
    iconUrlCache.clear()
    pendingFetches.clear()
}

async function loadIconUrl(exePath: string): Promise<string | undefined> {
    const cached = iconUrlCache.get(exePath)
    if (cached) return cached

    const pending = pendingFetches.get(exePath)
    if (pending) return pending

    if (typeof api.extractIcon !== 'function') return undefined

    const request = api
        .extractIcon(exePath)
        .then((b64) => {
            const next = b64 ? `data:image/png;base64,${b64}` : undefined
            if (next) iconUrlCache.set(exePath, next)
            pendingFetches.delete(exePath)
            return next
        })
        .catch(() => {
            pendingFetches.delete(exePath)
            return undefined
        })

    pendingFetches.set(exePath, request)
    return request
}

export function useIconUrl(exePath?: string) {
    const [iconUrl, setIconUrl] = useState<string | undefined>(() =>
        exePath ? iconUrlCache.get(exePath) : undefined,
    )

    useEffect(() => {
        let cancelled = false

        if (!exePath) {
            setIconUrl(undefined)
            return () => {
                cancelled = true
            }
        }

        const cached = iconUrlCache.get(exePath)
        if (cached) {
            setIconUrl(cached)
            return () => {
                cancelled = true
            }
        }

        loadIconUrl(exePath)
            .then((url) => {
                if (!cancelled) setIconUrl(url)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [exePath])

    return iconUrl
}

export function useAppIconUrls(apps: ManagedApp[]) {
    const [iconUrls, setIconUrls] = useState<Record<string, string | undefined>>({})

    useEffect(() => {
        let cancelled = false

        apps.forEach((app) => {
            loadIconUrl(app.exe_path)
                .then((url) => {
                    if (cancelled) return
                    setIconUrls((prev) => {
                        if (prev[app.id] === url) return prev
                        return {
                            ...prev,
                            [app.id]: url,
                        }
                    })
                })
                .catch(() => {})
        })

        return () => {
            cancelled = true
        }
    }, [apps])

    return iconUrls
}
