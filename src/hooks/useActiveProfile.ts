import { useEffect, useState } from 'react'
import { api, type Profile } from '@/lib/api'

export function useActiveProfile(): Profile | null {
    const [activeProfile, setActiveProfile] = useState<Profile | null>(null)

    useEffect(() => {
        let mounted = true

        async function loadActiveProfile() {
            const [profiles, activeId] = await Promise.all([
                api.getProfiles(),
                api.getActiveProfileId(),
            ])

            if (mounted) {
                setActiveProfile(profiles.find((profile) => profile.id === activeId) ?? null)
            }
        }

        loadActiveProfile().catch(() => {
            if (mounted) setActiveProfile(null)
        })

        return () => {
            mounted = false
        }
    }, [])

    return activeProfile
}
