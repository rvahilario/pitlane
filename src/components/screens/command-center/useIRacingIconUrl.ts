import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const iconUrlCache = new Map<string, string>()
const pendingFetches = new Map<string, Promise<string | null>>()
let lastKnownIconUrl: string | undefined

export function useIRacingIconUrl(iRacingRunning: boolean) {
    const [iconUrl, setIconUrl] = useState<string | undefined>(() => lastKnownIconUrl)

    useEffect(() => {
        let cancelled = false

        if (!iRacingRunning || typeof api.getIRacingExePath !== 'function') {
            return () => {
                cancelled = true
            }
        }

        api.getIRacingExePath()
            .then((exePath) => {
                if (cancelled || !exePath || typeof api.extractIcon !== 'function') return null

                const cached = iconUrlCache.get(exePath)
                if (cached) {
                    lastKnownIconUrl = cached
                    setIconUrl(cached)
                    return cached
                }

                const pending = pendingFetches.get(exePath)
                if (pending) {
                    return pending
                }

                const request = api
                    .extractIcon(exePath)
                    .then((b64) => {
                        const next = b64 ? `data:image/png;base64,${b64}` : null
                        if (next) {
                            iconUrlCache.set(exePath, next)
                            lastKnownIconUrl = next
                        }
                        pendingFetches.delete(exePath)
                        return next
                    })
                    .catch(() => {
                        pendingFetches.delete(exePath)
                        return null
                    })

                pendingFetches.set(exePath, request)
                return request
            })
            .then((url) => {
                if (cancelled || !url) return
                setIconUrl(url)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [iRacingRunning])

    return iconUrl
}
