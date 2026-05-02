import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandCenterScreen } from '@/components/screens/CommandCenterScreen'
import { computeAppSummary, computeReadiness } from '@/lib/command-center'
import type { AppStatus, ManagedApp } from '@/lib/api'

vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@/lib/api', () => ({
    api: {
        getApps: vi.fn(),
        getProfiles: vi.fn(),
        getActiveProfileId: vi.fn(),
        getAutoStop: vi.fn(),
        getIRacingStatus: vi.fn(),
        getAppStatuses: vi.fn(),
        getLog: vi.fn(),
        forceLaunchApp: vi.fn(),
        forceKillApp: vi.fn(),
        updateApp: vi.fn(),
        extractIcon: vi.fn(),
    },
}))

const { api } = await import('@/lib/api')

function makeApp(overrides: Partial<ManagedApp> = {}): ManagedApp {
    return {
        id: '1',
        profile_id: 'p1',
        name: 'SimHub',
        exe_path: 'C:/SimHub/SimHub.exe',
        args: null,
        working_dir: null,
        enabled: true,
        start_minimized: true,
        restart_on_crash: false,
        max_restart_attempts: 3,
        startup_delay_secs: 0,
        track_process_name: null,
        force_kill_on_stop: false,
        kill_process_tree: false,
        stop_with_iracing: true,
        ...overrides,
    }
}

function makeStatus(app_id: string, state: AppStatus['state']): AppStatus {
    return { app_id, name: 'SimHub', state }
}

beforeEach(() => {
    vi.mocked(api.getApps).mockResolvedValue([])
    vi.mocked(api.getProfiles).mockResolvedValue([])
    vi.mocked(api.getActiveProfileId).mockResolvedValue('p1')
    vi.mocked(api.getAutoStop).mockResolvedValue(true)
    vi.mocked(api.getIRacingStatus).mockResolvedValue(false)
    vi.mocked(api.getAppStatuses).mockResolvedValue([])
    vi.mocked(api.getLog).mockResolvedValue([])
    vi.mocked(api.forceLaunchApp).mockResolvedValue(undefined)
    vi.mocked(api.forceKillApp).mockResolvedValue(undefined)
    vi.mocked(api.updateApp).mockResolvedValue(makeApp())
    vi.mocked(api.extractIcon).mockResolvedValue(null)
})

// --- computeAppSummary ---

describe('computeAppSummary', () => {
    it('returns zeros for empty inputs', () => {
        expect(computeAppSummary([], [])).toEqual({
            total: 0,
            running: 0,
            crashed: 0,
            idle: 0,
            disabled: 0,
            ready: 0,
        })
    })

    it('counts total apps', () => {
        const apps = [makeApp({ id: '1' }), makeApp({ id: '2' }), makeApp({ id: '3' })]
        expect(computeAppSummary(apps, []).total).toBe(3)
    })

    it('counts disabled apps', () => {
        const apps = [
            makeApp({ id: '1', enabled: true }),
            makeApp({ id: '2', enabled: false }),
            makeApp({ id: '3', enabled: false }),
        ]
        expect(computeAppSummary(apps, []).disabled).toBe(2)
    })

    it('counts running from statuses', () => {
        const apps = [makeApp({ id: '1' }), makeApp({ id: '2' })]
        const statuses = [
            makeStatus('1', { type: 'running', pid: 100, restart_count: 0 }),
            makeStatus('2', { type: 'running', pid: 101, restart_count: 0 }),
        ]
        expect(computeAppSummary(apps, statuses).running).toBe(2)
    })

    it('counts crashed from statuses', () => {
        const apps = [makeApp({ id: '1' }), makeApp({ id: '2' })]
        const statuses = [makeStatus('1', { type: 'crashed' })]
        expect(computeAppSummary(apps, statuses).crashed).toBe(1)
    })

    it('counts idle as enabled apps with no running/crashed status', () => {
        const apps = [
            makeApp({ id: '1', enabled: true }),
            makeApp({ id: '2', enabled: true }),
            makeApp({ id: '3', enabled: false }),
        ]
        const statuses = [makeStatus('1', { type: 'running', pid: 100, restart_count: 0 })]
        // app2: enabled, no status → idle. app1: running. app3: disabled.
        expect(computeAppSummary(apps, statuses).idle).toBe(1)
    })

    it('counts idle status type as idle', () => {
        const apps = [makeApp({ id: '1', enabled: true })]
        const statuses = [makeStatus('1', { type: 'idle' })]
        expect(computeAppSummary(apps, statuses).idle).toBe(1)
    })

    it('excludes disabled apps from idle count', () => {
        const apps = [makeApp({ id: '1', enabled: false })]
        expect(computeAppSummary(apps, []).idle).toBe(0)
    })

    it('counts ready as enabled apps that are not crashed', () => {
        const apps = [
            makeApp({ id: '1', enabled: true }),
            makeApp({ id: '2', enabled: true }),
            makeApp({ id: '3', enabled: false }),
        ]
        const statuses = [makeStatus('2', { type: 'crashed' })]
        // app1: enabled, no crash → ready. app2: crashed → not ready. app3: disabled → not ready.
        expect(computeAppSummary(apps, statuses).ready).toBe(1)
    })

    it('includes running enabled apps in ready count', () => {
        const apps = [makeApp({ id: '1', enabled: true }), makeApp({ id: '2', enabled: true })]
        const statuses = [makeStatus('1', { type: 'running', pid: 100, restart_count: 0 })]
        // both enabled and neither is crashed → both ready
        expect(computeAppSummary(apps, statuses).ready).toBe(2)
    })

    it('excludes disabled apps from ready count', () => {
        const apps = [makeApp({ id: '1', enabled: false })]
        expect(computeAppSummary(apps, []).ready).toBe(0)
    })
})

// --- computeReadiness ---

describe('computeReadiness', () => {
    it('returns no_iracing when iRacing is offline', () => {
        expect(computeReadiness(false, 0)).toBe('no_iracing')
    })

    it('returns no_iracing even with crashes when iRacing is offline', () => {
        expect(computeReadiness(false, 3)).toBe('no_iracing')
    })

    it('returns needs_attention when iRacing is running and apps are crashed', () => {
        expect(computeReadiness(true, 1)).toBe('needs_attention')
        expect(computeReadiness(true, 5)).toBe('needs_attention')
    })

    it('returns ready when iRacing is running and no apps are crashed', () => {
        expect(computeReadiness(true, 0)).toBe('ready')
    })
})

// --- CommandCenterScreen render ---

describe('CommandCenterScreen', () => {
    it('renders readiness status when iRacing is offline', async () => {
        render(<CommandCenterScreen />)
        await waitFor(() => expect(screen.getByText('iRacing not detected')).toBeInTheDocument())
    })

    it('renders empty apps state when no apps are configured', async () => {
        render(<CommandCenterScreen />)
        await waitFor(() => expect(screen.getByText(/no apps configured/i)).toBeInTheDocument())
    })

    it('renders apps panel title', async () => {
        render(<CommandCenterScreen />)
        await waitFor(() => expect(screen.getByText(/applications/i)).toBeInTheDocument())
    })

    it('renders app names when apps exist', async () => {
        vi.mocked(api.getApps).mockResolvedValue([
            makeApp({ id: '1', name: 'SimHub' }),
            makeApp({ id: '2', name: 'CrewChief', exe_path: 'CrewChief.exe' }),
        ])
        render(<CommandCenterScreen />)
        await waitFor(() => expect(screen.getByText('SimHub')).toBeInTheDocument())
        expect(screen.getByText('CrewChief')).toBeInTheDocument()
    })

    it('starts a single app from the command row', async () => {
        vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: '42' })])
        vi.mocked(api.getAppStatuses).mockResolvedValue([makeStatus('42', { type: 'idle' })])
        render(<CommandCenterScreen />)

        await screen.findByText('SimHub')
        await userEvent.click(screen.getByRole('button', { name: 'Start' }))

        expect(api.forceLaunchApp).toHaveBeenCalledWith('42')
    })

    it('stops a single app from the command row', async () => {
        vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: '42' })])
        vi.mocked(api.getAppStatuses).mockResolvedValue([
            makeStatus('42', { type: 'running', pid: 99, restart_count: 0 }),
        ])
        render(<CommandCenterScreen />)

        await screen.findByText('SimHub')
        await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

        expect(api.forceKillApp).toHaveBeenCalledWith('42')
    })

    it('updates auto-launch through the command row toggle', async () => {
        vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: '42', enabled: true })])
        vi.mocked(api.updateApp).mockResolvedValue(makeApp({ id: '42', enabled: false }))
        render(<CommandCenterScreen />)

        await screen.findByText('SimHub')
        await userEvent.click(screen.getByRole('switch', { name: 'SimHub auto-launch' }))

        expect(api.updateApp).toHaveBeenCalledWith('42', { enabled: false })
    })

    it('updates auto-stop through the command row toggle', async () => {
        vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: '42', stop_with_iracing: true })])
        vi.mocked(api.updateApp).mockResolvedValue(makeApp({ id: '42', stop_with_iracing: false }))
        render(<CommandCenterScreen />)

        await screen.findByText('SimHub')
        await userEvent.click(screen.getByRole('switch', { name: 'SimHub auto-stop' }))

        expect(api.updateApp).toHaveBeenCalledWith('42', { stop_with_iracing: false })
    })

    it('starts all enabled apps that are not already running', async () => {
        vi.mocked(api.getApps).mockResolvedValue([
            makeApp({ id: 'idle', name: 'IdleApp' }),
            makeApp({ id: 'running', name: 'RunningApp' }),
            makeApp({ id: 'disabled', name: 'DisabledApp', enabled: false }),
        ])
        vi.mocked(api.getAppStatuses).mockResolvedValue([
            makeStatus('idle', { type: 'idle' }),
            makeStatus('running', { type: 'running', pid: 99, restart_count: 0 }),
        ])
        render(<CommandCenterScreen />)

        await screen.findByText('IdleApp')
        await userEvent.click(screen.getByRole('button', { name: 'Start All' }))

        expect(api.forceLaunchApp).toHaveBeenCalledTimes(1)
        expect(api.forceLaunchApp).toHaveBeenCalledWith('idle')
    })

    it('stops all running apps', async () => {
        vi.mocked(api.getApps).mockResolvedValue([
            makeApp({ id: 'running-1', name: 'RunningOne' }),
            makeApp({ id: 'running-2', name: 'RunningTwo' }),
            makeApp({ id: 'idle', name: 'IdleApp' }),
        ])
        vi.mocked(api.getAppStatuses).mockResolvedValue([
            makeStatus('running-1', { type: 'running', pid: 99, restart_count: 0 }),
            makeStatus('running-2', { type: 'running', pid: 100, restart_count: 0 }),
            makeStatus('idle', { type: 'idle' }),
        ])
        render(<CommandCenterScreen />)

        await screen.findByText('RunningOne')
        await userEvent.click(screen.getByRole('button', { name: 'Stop All' }))

        expect(api.forceKillApp).toHaveBeenCalledTimes(2)
        expect(api.forceKillApp).toHaveBeenCalledWith('running-1')
        expect(api.forceKillApp).toHaveBeenCalledWith('running-2')
    })

    it('does not render restart as a functional action for crashed apps', async () => {
        vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: '42' })])
        vi.mocked(api.getAppStatuses).mockResolvedValue([makeStatus('42', { type: 'crashed' })])
        render(<CommandCenterScreen />)

        await screen.findByText('SimHub')

        expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Restart' })).not.toBeInTheDocument()
    })
})
