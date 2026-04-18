import { useState } from "react";
import { StatusBar } from "@/components/StatusBar";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { AppsScreen } from "@/components/screens/AppsScreen";
import { LogScreen } from "@/components/screens/LogScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { useIRacingStatus } from "@/hooks/useIRacingStatus";

function App() {
  const [tab, setTab] = useState<Tab>("apps");
  const iRacingRunning = useIRacingStatus();

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      <StatusBar
        iRacingRunning={iRacingRunning}
        sessionType={null}
        managedCount={0}
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
