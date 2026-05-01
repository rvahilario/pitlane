import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_TAB, NAV_ITEMS, Sidebar, TAB_IDS, type Tab } from '@/components'

describe('Sidebar', () => {
    it('renders V0 navigation tabs without future or out-of-scope tabs', () => {
        render(<Sidebar active={DEFAULT_TAB} onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Command Center' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Apps' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Logs' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
        expect(screen.getAllByRole('button')).toHaveLength(TAB_IDS.length)
        expect(screen.queryByRole('button', { name: 'Profiles' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Automation' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Integrations' })).not.toBeInTheDocument()
    })

    it('uses centralized tab constants', () => {
        expect(TAB_IDS).toEqual(['command', 'apps', 'logs', 'settings'])
        expect(NAV_ITEMS.map((item) => item.id)).toEqual(TAB_IDS)
    })

    it('marks the active tab as the current page', () => {
        const activeTab = TAB_IDS[2]
        render(<Sidebar active={activeTab} onChange={vi.fn()} />)

        expect(screen.getByTestId(`nav-${activeTab}`)).toHaveAttribute('aria-current', 'page')
    })

    it('calls onChange with the selected tab', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn<(tab: Tab) => void>()
        const selectedTab = TAB_IDS[2]
        render(<Sidebar active={TAB_IDS[1]} onChange={onChange} />)

        await user.click(screen.getByTestId(`nav-${selectedTab}`))

        expect(onChange).toHaveBeenCalledWith(selectedTab)
    })
})
