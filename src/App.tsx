import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TAB, Sidebar, type Tab } from '@/components'
import { AppShell, BottomStatusBar, TopBar } from '@/components/layout'
import { AppsScreen, LogScreen, SettingsScreen } from '@/components/screens'
import { useActiveProfile, useIRacingStatus, useAppStatuses } from '@/hooks'
import { api } from '@/lib/api'

function App() {
    const [tab, setTab] = useState<Tab>(DEFAULT_TAB)
    const iRacingRunning = useIRacingStatus()
    const statuses = useAppStatuses()
    const activeProfile = useActiveProfile()
    const { t, i18n } = useTranslation()

    useEffect(() => {
        api.setTrayLabels(t('tray.show'), t('tray.quit')).catch(() => {})
    }, [i18n.language])

    const sessionLabel = iRacingRunning ? t('status.iracing_open') : t('status.iracing_offline')

    return (
        <AppShell
            topBar={
                <TopBar
                    activeProfileName={activeProfile?.name}
                    profileLabel={t('shell.active_profile')}
                />
            }
            sidebar={<Sidebar active={tab} onChange={setTab} />}
            bottomBar={
                <BottomStatusBar
                    activeProfileName={activeProfile?.name}
                    iRacingRunning={iRacingRunning}
                    managedLabel={t('shell.managed_apps', { count: statuses.length })}
                    paused={false}
                    pausedLabel={t('status.paused')}
                    profileLabel={t('shell.profile')}
                    sessionLabel={sessionLabel}
                />
            }
        >
            {tab === 'command' && <PlaceholderScreen title={t('nav.command')} />}
            {tab === 'apps' && <AppsScreen />}
            {tab === 'logs' && <LogScreen />}
            {tab === 'settings' && <SettingsScreen />}
        </AppShell>
    )
}

function PlaceholderScreen({ title }: { title: string }) {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
                {title}
            </div>
        </div>
    )
}

export default App
