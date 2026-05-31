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

export const KIND_VARIANT: Record<LogKind, 'launch' | 'stop' | 'crashed' | 'restarted' | 'iracing' | 'error' | 'info'> = {
    launch: 'launch',
    stop: 'stop',
    crashed: 'crashed',
    restarted: 'restarted',
    iracing_start: 'iracing',
    iracing_stop: 'iracing',
}

export function formatTime(ms: number): string {
    const d = new Date(ms)
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':')
}

import type { LogEntry } from './api'
import i18n from '@/i18n'

export function formatLogMessage(entry: LogEntry): string {
    const t = i18n.t
    switch (entry.kind) {
        case 'launch':
            return entry.pid != null ? t('log.msg.started', { pid: entry.pid }) : ''
        case 'stop':
            return t('log.msg.stopped')
        case 'crashed':
            if (entry.restart_count != null && entry.max_restarts != null) {
                return t('log.msg.crashed', {
                    restart_count: entry.restart_count,
                    max_restarts: entry.max_restarts,
                })
            }
            return t('log.msg.crashed_simple')
        case 'restarted':
            if (entry.restart_count != null && entry.max_restarts != null && entry.pid != null) {
                return t('log.msg.restarted', {
                    attempt: entry.restart_count,
                    max_restarts: entry.max_restarts,
                    pid: entry.pid,
                })
            }
            return t('log.msg.restarted_simple')
        case 'iracing_start':
            return t('log.msg.iracing_started')
        case 'iracing_stop':
            return t('log.msg.iracing_stopped')
        default:
            return entry.msg
    }
}
