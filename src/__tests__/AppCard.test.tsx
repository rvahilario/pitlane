import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AppCard } from '@/components/AppCard'
import { api } from '@/lib/api'
import { resetAppIconUrlCacheForTests } from '@/components/screens/command-center/useAppIconUrls'
import type { ManagedApp, AppStatus } from '@/lib/api'

vi.mock('@/lib/api')

const mockApp: ManagedApp = {
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
}

const noop = vi.fn()

beforeEach(() => {
    resetAppIconUrlCacheForTests()
    vi.mocked(api.extractIcon).mockResolvedValue(null)
})

describe('AppCard icon extraction', () => {
    it('calls extractIcon with exe_path on mount', async () => {
        render(
            <AppCard
                app={mockApp}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )

        await waitFor(() => {
            expect(api.extractIcon).toHaveBeenCalledWith('C:/SimHub/SimHub.exe')
        })
    })

    it('renders letter avatar when extractIcon returns null', async () => {
        vi.mocked(api.extractIcon).mockResolvedValue(null)

        render(
            <AppCard
                app={mockApp}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )

        await waitFor(() => expect(api.extractIcon).toHaveBeenCalled())
        expect(screen.queryByRole('img')).not.toBeInTheDocument()
        expect(screen.getByText('S')).toBeInTheDocument()
    })

    it('renders img when extractIcon returns base64', async () => {
        vi.mocked(api.extractIcon).mockResolvedValue('abc123')

        render(
            <AppCard
                app={mockApp}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )

        const img = await screen.findByRole('img', { name: 'SimHub' })
        expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123')
    })

    it('re-fetches icon when exe_path changes', async () => {
        const { rerender } = render(
            <AppCard
                app={mockApp}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )

        await waitFor(() => expect(api.extractIcon).toHaveBeenCalledWith('C:/SimHub/SimHub.exe'))

        rerender(
            <AppCard
                app={{ ...mockApp, exe_path: 'C:/Other/App.exe' }}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )

        await waitFor(() => expect(api.extractIcon).toHaveBeenCalledWith('C:/Other/App.exe'))
    })
})

describe('AppCard status display', () => {
    it('shows start button when idle', () => {
        render(
            <AppCard
                app={mockApp}
                status={undefined}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )
        expect(screen.getByTitle(/start/i)).toBeInTheDocument()
    })

    it('shows stop button when running', () => {
        const running: AppStatus = {
            app_id: '1',
            name: 'SimHub',
            state: { type: 'running', pid: 99, restart_count: 0 },
        }
        render(
            <AppCard
                app={mockApp}
                status={running}
                onStart={noop}
                onStop={noop}
                onEdit={noop}
                onDelete={noop}
                onToggleEnabled={noop}
                onToggleStopWithIracing={noop}
            />,
        )
        expect(screen.getByTitle(/stop/i)).toBeInTheDocument()
    })
})
