import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '@/components/ui/Dropdown'

function makeDropdown(onSelect = vi.fn()) {
    return (
        <Dropdown trigger={(open) => <button>Trigger {open ? 'open' : 'closed'}</button>}>
            <button onClick={onSelect}>Option A</button>
            <button>Option B</button>
        </Dropdown>
    )
}

describe('Dropdown', () => {
    it('renders trigger, hides menu by default', () => {
        render(makeDropdown())
        expect(screen.getByText('Trigger closed')).toBeInTheDocument()
        expect(screen.queryByText('Option A')).not.toBeInTheDocument()
    })

    it('opens menu on trigger click', async () => {
        const user = userEvent.setup()
        render(makeDropdown())
        await user.click(screen.getByText('Trigger closed'))
        expect(screen.getByText('Option A')).toBeInTheDocument()
        expect(screen.getByText('Trigger open')).toBeInTheDocument()
    })

    it('closes menu after selecting an item', async () => {
        const user = userEvent.setup()
        render(makeDropdown())
        await user.click(screen.getByText('Trigger closed'))
        await user.click(screen.getByText('Option A'))
        expect(screen.queryByText('Option A')).not.toBeInTheDocument()
    })

    it('calls item handler when item is selected', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(makeDropdown(onSelect))
        await user.click(screen.getByText('Trigger closed'))
        await user.click(screen.getByText('Option A'))
        expect(onSelect).toHaveBeenCalledOnce()
    })

    it('closes on click outside', async () => {
        const user = userEvent.setup()
        render(
            <div>
                {makeDropdown()}
                <button>Outside</button>
            </div>,
        )
        await user.click(screen.getByText('Trigger closed'))
        expect(screen.getByText('Option A')).toBeInTheDocument()
        await user.click(screen.getByText('Outside'))
        expect(screen.queryByText('Option A')).not.toBeInTheDocument()
    })

    it('snapshot — closed', () => {
        const { container } = render(makeDropdown())
        expect(container.firstChild).toMatchSnapshot()
    })

    it('snapshot — open', async () => {
        const user = userEvent.setup()
        const { container } = render(makeDropdown())
        await user.click(screen.getByText('Trigger closed'))
        expect(container.firstChild).toMatchSnapshot()
    })
})
