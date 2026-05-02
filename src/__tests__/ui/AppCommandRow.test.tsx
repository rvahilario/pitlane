import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppCommandRow } from '@/components/ui'
import type { AppStatus, ManagedApp } from '@/lib/api'

const app: ManagedApp = {
    id: 'app-1',
    profile_id: 'profile-1',
    name: 'SimHub',
    exe_path: 'C:\\SimHub\\SimHub.exe',
    args: null,
    working_dir: null,
    enabled: true,
    start_minimized: false,
    restart_on_crash: false,
    max_restart_attempts: 3,
    startup_delay_secs: 0,
    track_process_name: null,
    force_kill_on_stop: false,
    kill_process_tree: false,
    stop_with_iracing: true,
}

const runningStatus: AppStatus = {
    app_id: 'app-1',
    name: 'SimHub',
    state: { type: 'running', pid: 1234, restart_count: 0 },
}

describe('AppCommandRow', () => {
    it('renders app identity and idle action', () => {
        render(
            <AppCommandRow
                app={app}
                onStart={vi.fn()}
                onStop={vi.fn()}
                onToggleAutoLaunch={vi.fn()}
                onToggleAutoStop={vi.fn()}
            />,
        )

        expect(screen.getByText('SimHub')).toBeInTheDocument()
        expect(screen.queryByText('v--')).not.toBeInTheDocument()
        expect(screen.getByText('Idle')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    })

    it('renders stop action when running', () => {
        render(
            <AppCommandRow
                app={app}
                status={runningStatus}
                onStart={vi.fn()}
                onStop={vi.fn()}
                onToggleAutoLaunch={vi.fn()}
                onToggleAutoStop={vi.fn()}
            />,
        )

        expect(screen.getByText('Running')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    })

    it('calls action handlers', async () => {
        const user = userEvent.setup()
        const onStart = vi.fn()
        const onMenu = vi.fn()
        render(
            <AppCommandRow
                app={app}
                onStart={onStart}
                onStop={vi.fn()}
                onToggleAutoLaunch={vi.fn()}
                onToggleAutoStop={vi.fn()}
                onOpenMenu={onMenu}
            />,
        )

        await user.click(screen.getByRole('button', { name: 'Start' }))
        await user.click(screen.getByRole('button', { name: 'SimHub actions' }))

        expect(onStart).toHaveBeenCalledOnce()
        expect(onMenu).toHaveBeenCalledOnce()
    })
})
