import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AppsScreen } from '@/components/screens/AppsScreen'
import { api } from '@/lib/api'
import type { ManagedApp, Profile } from '@/lib/api'

vi.mock('@/lib/api')

const mockProfile: Profile = {
    id: 'profile-1',
    name: 'Default',
    enabled: true,
    color: null,
    trigger_mode: null,
}

const mockApp: ManagedApp = {
    id: 'app-1',
    profile_id: 'profile-1',
    name: 'SimHub',
    exe_path: 'C:\\SimHub\\SimHubWPF.exe',
    args: null,
    working_dir: null,
    enabled: true,
    start_minimized: true,
    restart_on_crash: true,
    max_restart_attempts: 3,
    startup_delay_secs: 0,
    track_process_name: null,
    force_kill_on_stop: false,
    kill_process_tree: false,
    stop_with_iracing: true,
}

const newApp: ManagedApp = {
    id: 'app-2',
    profile_id: 'profile-1',
    name: 'CrewChief',
    exe_path: 'C:\\CrewChief\\CrewChiefV4.exe',
    args: null,
    working_dir: null,
    enabled: true,
    start_minimized: false,
    restart_on_crash: true,
    max_restart_attempts: 3,
    startup_delay_secs: 0,
    track_process_name: null,
    force_kill_on_stop: false,
    kill_process_tree: false,
    stop_with_iracing: true,
}

beforeEach(() => {
    vi.mocked(api.getApps).mockResolvedValue([mockApp])
    vi.mocked(api.getProfiles).mockResolvedValue([mockProfile])
    vi.mocked(api.getActiveProfileId).mockResolvedValue('profile-1')
    vi.mocked(api.addApp).mockResolvedValue(newApp)
    vi.mocked(api.getAppStatuses).mockResolvedValue([])
})

describe('Add app flow', () => {
    it('should not show modal before Add is clicked', async () => {
        render(<AppsScreen />)
        await screen.findByText('SimHub')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should open modal when Add button is clicked', async () => {
        render(<AppsScreen />)
        await screen.findByText('SimHub')

        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render name and exe_path fields in modal', async () => {
        render(<AppsScreen />)
        await screen.findByText('SimHub')

        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/executable/i)).toBeInTheDocument()
    })

    it('should call api.addApp with name and exe_path on submit', async () => {
        render(<AppsScreen />)
        await screen.findByText('SimHub')

        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: 'CrewChief' },
        })
        fireEvent.change(screen.getByLabelText(/executable/i), {
            target: { value: 'C:\\CrewChief\\CrewChiefV4.exe' },
        })

        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog.querySelector("button[type='submit']")!)

        await waitFor(() => {
            expect(api.addApp).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'CrewChief',
                    exe_path: 'C:\\CrewChief\\CrewChiefV4.exe',
                }),
            )
        })
    })

    it('should close modal and show new app in list after successful add', async () => {
        vi.mocked(api.getApps)
            .mockResolvedValueOnce([mockApp])
            .mockResolvedValueOnce([mockApp, newApp])

        render(<AppsScreen />)
        await screen.findByText('SimHub')

        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: 'CrewChief' },
        })
        fireEvent.change(screen.getByLabelText(/executable/i), {
            target: { value: 'C:\\CrewChief\\CrewChiefV4.exe' },
        })

        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog.querySelector("button[type='submit']")!)

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        await screen.findByText('CrewChief')
    })

    it('should close modal without calling api.addApp when Cancel is clicked', async () => {
        render(<AppsScreen />)
        await screen.findByText('SimHub')

        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByRole('dialog')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(api.addApp).not.toHaveBeenCalled()
    })
})
