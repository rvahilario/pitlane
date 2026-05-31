import { invoke } from '@tauri-apps/api/core'

export interface ManagedApp {
    id: string
    profile_id: string
    name: string
    exe_path: string
    args: string | null
    working_dir: string | null
    enabled: boolean
    start_minimized: boolean
    restart_on_crash: boolean
    max_restart_attempts: number
    startup_delay_secs: number
    track_process_name: string | null
    force_kill_on_stop: boolean
    kill_process_tree: boolean
    stop_with_iracing: boolean
}

export interface Profile {
    id: string
    name: string
    enabled: boolean
    color: string | null
    trigger_mode: 'ui' | 'race' | null
}

export type TriggerMode = 'ui' | 'race'

export interface Settings {
    poll_interval_secs: number
    default_trigger: TriggerMode
    notifications_enabled: boolean
    autostart: boolean
}

export interface NewApp {
    name: string
    exe_path: string
    args?: string
    working_dir?: string
    enabled?: boolean
    start_minimized?: boolean
    restart_on_crash?: boolean
    max_restart_attempts?: number
    startup_delay_secs?: number
    track_process_name?: string
    force_kill_on_stop?: boolean
    kill_process_tree?: boolean
    stop_with_iracing?: boolean
}

export interface UpdateApp {
    name?: string
    exe_path?: string
    args?: string | null
    working_dir?: string | null
    enabled?: boolean
    start_minimized?: boolean
    restart_on_crash?: boolean
    max_restart_attempts?: number
    startup_delay_secs?: number
    track_process_name?: string | null
    force_kill_on_stop?: boolean
    kill_process_tree?: boolean
    stop_with_iracing?: boolean
}

export type LogKind = 'launch' | 'stop' | 'crashed' | 'iracing_start' | 'iracing_stop'

export interface LogEntry {
    seq: number
    timestamp_ms: number
    kind: LogKind
    app: string | null
    msg: string
}

export type AppStateType =
    | { type: 'idle' }
    | { type: 'running'; pid: number; restart_count: number }
    | { type: 'crashed' }

export interface AppStatus {
    app_id: string
    name: string
    state: AppStateType
}

export const api = {
    getProfiles: () => invoke<Profile[]>('get_profiles'),
    getApps: () => invoke<ManagedApp[]>('get_apps'),
    getSettings: () => invoke<Settings>('get_settings'),
    getActiveProfileId: () => invoke<string>('get_active_profile_id'),
    saveSettings: (settings: Settings) => invoke<void>('save_settings', { settings }),
    addApp: (app: NewApp) => invoke<ManagedApp>('add_app', { app }),
    updateApp: (appId: string, update: UpdateApp) =>
        invoke<ManagedApp>('update_app', { appId, update }),
    deleteApp: (appId: string) => invoke<void>('delete_app', { appId }),
    getLog: () => invoke<LogEntry[]>('get_log'),
    getAutoStop: () => invoke<boolean>('get_auto_stop'),
    setAutoStop: (enabled: boolean) => invoke<void>('set_auto_stop', { enabled }),
    getIRacingStatus: () => invoke<boolean>('get_iracing_status'),
    getIRacingExePath: () => invoke<string | null>('get_iracing_exe_path'),
    getAppStatuses: () => invoke<AppStatus[]>('get_app_statuses'),
    forceLaunchApp: (appId: string) => invoke<void>('force_launch_app', { appId }),
    forceKillApp: (appId: string) => invoke<void>('force_kill_app', { appId }),
    setTrayLabels: (showLabel: string, quitLabel: string) =>
        invoke<void>('set_tray_labels', { showLabel, quitLabel }),
    getAutostartEnabled: () => invoke<boolean>('get_autostart_enabled'),
    extractIcon: (exePath: string) => invoke<string | null>('extract_icon', { exePath }),
}
