import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '@/components/ui/Toggle'

describe('Toggle', () => {
    it('renders with correct role and aria-checked when on', () => {
        render(<Toggle checked onChange={vi.fn()} label="Auto start" />)
        const toggle = screen.getByRole('switch', { name: 'Auto start' })
        expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    it('renders with aria-checked false when off', () => {
        render(<Toggle checked={false} onChange={vi.fn()} label="Auto start" />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('calls onChange with toggled value when clicked', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<Toggle checked={false} onChange={onChange} label="Auto start" />)
        await user.click(screen.getByRole('switch'))
        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('does not call onChange when disabled', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<Toggle checked={false} onChange={onChange} label="Auto start" disabled />)
        await user.click(screen.getByRole('switch'))
        expect(onChange).not.toHaveBeenCalled()
    })

    it('is disabled when disabled prop is set', () => {
        render(<Toggle checked={false} onChange={vi.fn()} label="Auto start" disabled />)
        expect(screen.getByRole('switch')).toBeDisabled()
    })

    it('snapshot — on', () => {
        const { container } = render(<Toggle checked onChange={vi.fn()} label="Auto start" />)
        expect(container.firstChild).toMatchSnapshot()
    })

    it('snapshot — off', () => {
        const { container } = render(
            <Toggle checked={false} onChange={vi.fn()} label="Auto start" />,
        )
        expect(container.firstChild).toMatchSnapshot()
    })

    it('snapshot — disabled', () => {
        const { container } = render(
            <Toggle checked={false} onChange={vi.fn()} label="Auto start" disabled />,
        )
        expect(container.firstChild).toMatchSnapshot()
    })
})
