import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TAB, Sidebar, TAB, type Tab } from '@/components'
import { AppShell, BottomStatusBar, TopBar } from '@/components/layout'
import { AppsScreen, CommandCenterScreen, LogScreen, SettingsScreen } from '@/components/screens'
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

    function renderScreen() {
        switch (tab) {
            case TAB.COMMAND:
                return <CommandCenterScreen onNavigateToApps={() => setTab(TAB.APPS)} />
            case TAB.APPS:
                return <AppsScreen />
            case TAB.LOGS:
                return <LogScreen />
            case TAB.SETTINGS:
                return <SettingsScreen />
            default:
                return <CommandCenterScreen onNavigateToApps={() => setTab(TAB.APPS)} />
        }
    }

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
            {renderScreen()}
        </AppShell>
    )
}

export default App
