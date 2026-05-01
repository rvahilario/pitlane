import { useState, useEffect } from 'react'
import { api, type Settings } from '@/lib/api'

const DEFAULT_SETTINGS: Settings = {
    poll_interval_secs: 1,
    default_trigger: 'ui',
    notifications_enabled: true,
    autostart: false,
}

interface UseSettingsResult {
    settings: Settings
    patch: <K extends keyof Settings>(key: K, value: Settings[K]) => void
    saving: boolean
    handleSave: () => Promise<void>
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        api.getSettings().then(setSettings)
    }, [])

    function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        setSaving(true)
        try {
            await api.saveSettings(settings)
        } finally {
            setSaving(false)
        }
    }

    return { settings, patch, saving, handleSave }
}
