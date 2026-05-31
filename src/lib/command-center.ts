import type { AppStatus, LogKind, ManagedApp } from './api'

export interface AppSummary {
    total: number
    running: number
    crashed: number
    idle: number
    disabled: number
    ready: number
}

export function computeAppSummary(apps: ManagedApp[], statuses: AppStatus[]): AppSummary {
    const statusMap = new Map(statuses.map((s) => [s.app_id, s]))
    const running = statuses.filter((s) => s.state.type === 'running').length
    const crashed = statuses.filter((s) => s.state.type === 'crashed').length
    const disabled = apps.filter((a) => !a.enabled).length
    const idle = apps.filter((a) => {
        if (!a.enabled) return false
        const s = statusMap.get(a.id)
        return !s || s.state.type === 'idle'
    }).length
    const ready = apps.filter((a) => {
        if (!a.enabled) return false
        const s = statusMap.get(a.id)
        return !s || s.state.type === 'running' || s.state.type === 'idle'
    }).length
    return { total: apps.length, running, crashed, idle, disabled, ready }
}

export type Readiness = 'ready' | 'needs_attention' | 'no_iracing'

export function computeReadiness(iRacingRunning: boolean, crashed: number): Readiness {
    if (!iRacingRunning) return 'no_iracing'
    if (crashed > 0) return 'needs_attention'
    return 'ready'
}

export const KIND_VARIANT: Record<LogKind, 'launch' | 'stop' | 'crashed' | 'iracing' | 'error' | 'info'> = {
    launch: 'launch',
    stop: 'stop',
    crashed: 'crashed',
    iracing_start: 'iracing',
    iracing_stop: 'iracing',
}

export function formatTime(ms: number): string {
    const d = new Date(ms)
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':')
}
