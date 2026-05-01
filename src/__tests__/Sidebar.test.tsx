import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar, type Tab } from '@/components'

describe('Sidebar', () => {
    it('renders planned navigation tabs without integrations', () => {
        render(<Sidebar active="apps" onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Command Center' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Apps' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Profiles' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Automation' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Logs' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Integrations' })).not.toBeInTheDocument()
    })

    it('marks the active tab as the current page', () => {
        render(<Sidebar active="logs" onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Logs' })).toHaveAttribute('aria-current', 'page')
    })

    it('calls onChange with the selected tab', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn<(tab: Tab) => void>()
        render(<Sidebar active="apps" onChange={onChange} />)

        await user.click(screen.getByRole('button', { name: 'Profiles' }))

        expect(onChange).toHaveBeenCalledWith('profiles')
    })
})
