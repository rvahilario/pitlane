import { useState, useEffect } from 'react'
import { api, type ManagedApp, type Profile } from '@/lib/api'

interface UseAppsResult {
    apps: ManagedApp[]
    activeProfile: Profile | null
    preventAutoStop: boolean
    refresh: () => Promise<void>
    toggleEnabled: (app: ManagedApp, enabled: boolean) => Promise<void>
    toggleStopWithIracing: (app: ManagedApp, stop_with_iracing: boolean) => Promise<void>
    togglePreventAutoStop: () => Promise<void>
    deleteApp: (app: ManagedApp) => Promise<void>
}

export function useApps(): UseAppsResult {
    const [apps, setApps] = useState<ManagedApp[]>([])
    const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
    const [preventAutoStop, setPreventAutoStop] = useState(false)

    async function refresh() {
        const [loadedApps, profiles, activeId, autoStopVal] = await Promise.all([
            api.getApps(),
            api.getProfiles(),
            api.getActiveProfileId(),
            api.getAutoStop(),
        ])
        setApps(loadedApps)
        setActiveProfile(profiles.find((p) => p.id === activeId) ?? null)
        setPreventAutoStop(!autoStopVal)
    }

    useEffect(() => {
        refresh()
    }, [])

    async function toggleEnabled(app: ManagedApp, enabled: boolean) {
        await api.updateApp(app.id, { enabled })
        setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, enabled } : a)))
    }

    async function toggleStopWithIracing(app: ManagedApp, stop_with_iracing: boolean) {
        await api.updateApp(app.id, { stop_with_iracing })
        setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, stop_with_iracing } : a)))
    }

    async function togglePreventAutoStop() {
        const next = !preventAutoStop
        setPreventAutoStop(next)
        await api.setAutoStop(!next)
    }

    async function deleteApp(app: ManagedApp) {
        await api.deleteApp(app.id)
        await refresh()
    }

    return {
        apps,
        activeProfile,
        preventAutoStop,
        refresh,
        toggleEnabled,
        toggleStopWithIracing,
        togglePreventAutoStop,
        deleteApp,
    }
}
