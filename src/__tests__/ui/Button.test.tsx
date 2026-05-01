import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Save</Button>)
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()
        render(<Button onClick={onClick}>Save</Button>)
        await user.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('does not call onClick when disabled', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()
        render(
            <Button disabled onClick={onClick}>
                Save
            </Button>,
        )
        await user.click(screen.getByRole('button'))
        expect(onClick).not.toHaveBeenCalled()
    })

    it('applies accent variant classes by default', () => {
        render(<Button>Save</Button>)
        const btn = screen.getByRole('button')
        expect(btn.className).toContain('bg-accent-solid')
    })

    it('applies danger variant classes', () => {
        render(<Button variant="danger">Delete</Button>)
        expect(screen.getByRole('button').className).toContain('bg-danger-solid')
    })

    it('applies success variant classes', () => {
        render(<Button variant="success">Start</Button>)
        expect(screen.getByRole('button').className).toContain('bg-success-solid')
    })

    it('applies ghost variant classes', () => {
        render(<Button variant="ghost">Cancel</Button>)
        expect(screen.getByRole('button').className).toContain('border-border-strong')
    })

    it('merges custom className', () => {
        render(<Button className="mt-4">Save</Button>)
        expect(screen.getByRole('button').className).toContain('mt-4')
    })

    it('snapshot — default accent', () => {
        const { container } = render(<Button>Save</Button>)
        expect(container.firstChild).toMatchSnapshot()
    })

    it('snapshot — danger md', () => {
        const { container } = render(
            <Button variant="danger" size="md">
                Delete
            </Button>,
        )
        expect(container.firstChild).toMatchSnapshot()
    })

    it('snapshot — icon', () => {
        const { container } = render(<Button variant="icon" aria-label="edit" />)
        expect(container.firstChild).toMatchSnapshot()
    })
})
