import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from 'lucide-react'
import { IconButton } from '@/components/ui'

describe('IconButton', () => {
    it('requires an accessible name and renders as a button', () => {
        render(
            <IconButton aria-label="Open settings">
                <Settings />
            </IconButton>,
        )

        expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()
        render(<IconButton aria-label="Open settings" onClick={onClick} />)

        await user.click(screen.getByRole('button', { name: 'Open settings' }))

        expect(onClick).toHaveBeenCalledOnce()
    })

    it('applies danger variant classes', () => {
        render(<IconButton aria-label="Delete" variant="danger" />)

        expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('border-danger')
    })
})
