import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TAB, StatusBar, Sidebar, type Tab } from '@/components'
import { AppsScreen, LogScreen, SettingsScreen } from '@/components/screens'
import { useIRacingStatus, useAppStatuses } from '@/hooks'
import { api } from '@/lib/api'

function App() {
    const [tab, setTab] = useState<Tab>(DEFAULT_TAB)
    const iRacingRunning = useIRacingStatus()
    const statuses = useAppStatuses()
    const { t, i18n } = useTranslation()

    useEffect(() => {
        api.setTrayLabels(t('tray.show'), t('tray.quit')).catch(() => {})
    }, [i18n.language])

    const managedCount = statuses.filter((s) => s.state.type === 'running').length

    return (
        <div className="flex flex-col h-screen bg-canvas">
            <StatusBar
                iRacingRunning={iRacingRunning}
                sessionType={null}
                managedCount={managedCount}
                paused={false}
            />

            <div className="flex flex-1 min-h-0">
                <Sidebar active={tab} onChange={setTab} />

                <main className="flex-1 min-w-0">
                    {tab === 'command' && <PlaceholderScreen title={t('nav.command')} />}
                    {tab === 'apps' && <AppsScreen />}
                    {tab === 'logs' && <LogScreen />}
                    {tab === 'settings' && <SettingsScreen />}
                </main>
            </div>
        </div>
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
