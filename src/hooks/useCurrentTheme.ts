import { useState, useEffect } from 'react'
import { getTheme, type Theme } from '@/theme'

export function useCurrentTheme(): Theme {
    const [current, setCurrent] = useState<Theme>(() => getTheme())

    useEffect(() => {
        function handleThemeChange(e: Event) {
            setCurrent((e as CustomEvent<Theme>).detail)
        }
        window.addEventListener('pitlane:theme-change', handleThemeChange)
        return () => window.removeEventListener('pitlane:theme-change', handleThemeChange)
    }, [])

    return current
}
