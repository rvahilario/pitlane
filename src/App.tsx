import { useState } from "react";
import { StatusBar } from "@/components/StatusBar";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { AppsScreen } from "@/components/screens/AppsScreen";
import { LogScreen } from "@/components/screens/LogScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

// Mock state — will be replaced by Rust IPC in Layer 3
const MOCK_STATUS = {
  iRacingRunning: true,
  sessionType: "service" as const,
  managedCount: 2,
  paused: false,
};

function App() {
  const [tab, setTab] = useState<Tab>("apps");

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      <StatusBar {...MOCK_STATUS} />

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
