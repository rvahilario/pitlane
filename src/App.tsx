import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, Sidebar, type Tab } from '@/components'
import { AppsScreen, LogScreen, HistoryScreen, SettingsScreen } from '@/components/screens'
import { useIRacingStatus, useAppStatuses } from '@/hooks'
import { api } from '@/lib/api'

function App() {
    const [tab, setTab] = useState<Tab>('apps')
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
                    {tab === 'apps' && <AppsScreen />}
                    {tab === 'log' && <LogScreen />}
                    {tab === 'history' && <HistoryScreen />}
                    {tab === 'settings' && <SettingsScreen />}
                </main>
            </div>
        </div>
    )
}

export default App
