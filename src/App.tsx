import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TAB, Sidebar, TAB, type Tab } from '@/components'
import { AppShell, TopBar } from '@/components/layout'
import { AppsScreen, CommandCenterScreen, LogScreen, SettingsScreen } from '@/components/screens'
import { useActiveProfile } from '@/hooks'
import { api } from '@/lib/api'

function App() {
    const [tab, setTab] = useState<Tab>(DEFAULT_TAB)
    const [openAddApp, setOpenAddApp] = useState(false)
    const activeProfile = useActiveProfile()
    const { t, i18n } = useTranslation()

    useEffect(() => {
        api.setTrayLabels(t('tray.show'), t('tray.quit')).catch(() => {})
    }, [i18n.language])

    function renderScreen() {
        switch (tab) {
            case TAB.COMMAND:
                return (
                    <CommandCenterScreen
                        onAddApp={() => {
                            setOpenAddApp(true)
                            setTab(TAB.APPS)
                        }}
                    />
                )
            case TAB.APPS:
                return (
                    <AppsScreen
                        openAddApp={openAddApp}
                        onOpenAddAppHandled={() => setOpenAddApp(false)}
                    />
                )
            case TAB.LOGS:
                return <LogScreen />
            case TAB.SETTINGS:
                return <SettingsScreen />
            default:
                return (
                    <CommandCenterScreen
                        onAddApp={() => {
                            setOpenAddApp(true)
                            setTab(TAB.APPS)
                        }}
                    />
                )
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
        >
            {renderScreen()}
        </AppShell>
    )
}

export default App
