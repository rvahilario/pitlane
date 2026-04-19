import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar } from "@/components/StatusBar";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { AppsScreen } from "@/components/screens/AppsScreen";
import { LogScreen } from "@/components/screens/LogScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { useIRacingStatus } from "@/hooks/useIRacingStatus";
import { useAppStatuses } from "@/hooks/useAppStatuses";
import { api } from "@/lib/api";

function App() {
  const [tab, setTab] = useState<Tab>("apps");
  const iRacingRunning = useIRacingStatus();
  const statuses = useAppStatuses();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    api.setTrayLabels(t("tray.show"), t("tray.quit")).catch(() => {});
  }, [i18n.language]);

  const managedCount = statuses.filter((s) => s.state.type === "running").length;

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      <StatusBar
        iRacingRunning={iRacingRunning}
        sessionType={null}
        managedCount={managedCount}
        paused={false}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar active={tab} onChange={setTab} />

        <main className="flex-1 min-w-0">
          {tab === "apps"     && <AppsScreen />}
          {tab === "log"      && <LogScreen />}
          {tab === "history"  && <HistoryScreen />}
          {tab === "settings" && <SettingsScreen />}
        </main>
      </div>
    </div>
  );
}

export default App;
