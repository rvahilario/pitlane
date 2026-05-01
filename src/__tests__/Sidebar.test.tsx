import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NAV_ITEMS, Sidebar, TAB_IDS, type Tab } from '@/components'

describe('Sidebar', () => {
    it('renders V0 navigation tabs without future or out-of-scope tabs', () => {
        render(<Sidebar active="apps" onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Command Center' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Apps' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Logs' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Profiles' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Automation' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Integrations' })).not.toBeInTheDocument()
    })

    it('uses centralized tab constants', () => {
        expect(TAB_IDS).toEqual(['command', 'apps', 'logs', 'settings'])
        expect(NAV_ITEMS.map((item) => item.id)).toEqual(TAB_IDS)
    })

    it('marks the active tab as the current page', () => {
        render(<Sidebar active="logs" onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Logs' })).toHaveAttribute('aria-current', 'page')
    })

    it('calls onChange with the selected tab', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn<(tab: Tab) => void>()
        render(<Sidebar active="apps" onChange={onChange} />)

        await user.click(screen.getByRole('button', { name: 'Logs' }))

        expect(onChange).toHaveBeenCalledWith('logs')
    })
})
