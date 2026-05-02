import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { AppFormModal } from '@/components/AppFormModal'

const noop = vi.fn()
const defaultProps = {
    mode: 'add' as const,
    onClose: noop,
    onSubmit: vi.fn().mockResolvedValue(undefined),
}

function renderModal(overrides = {}) {
    return render(<AppFormModal {...defaultProps} {...overrides} />)
}

describe('AppFormModal sections', () => {
    it('renders Basic and Launch sections open by default', () => {
        renderModal()
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/executable/i)).toBeInTheDocument()
        // Launch section visible — label text without associated input id
        expect(screen.getByText(/startup delay/i)).toBeInTheDocument()
    })

    it('renders Recovery section collapsed by default', () => {
        renderModal()
        expect(screen.queryByLabelText(/restart on crash/i)).not.toBeInTheDocument()
    })

    it('expands Recovery section on toggle click', () => {
        renderModal()
        const recoveryToggle = screen.getByRole('button', { name: /recovery/i })
        expect(recoveryToggle).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(recoveryToggle)
        expect(recoveryToggle).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByLabelText(/restart on crash/i)).toBeInTheDocument()
    })

    it('renders Advanced section collapsed by default', () => {
        renderModal()
        expect(screen.queryByText(/track process name/i)).not.toBeInTheDocument()
    })

    it('expands Advanced section on toggle click', () => {
        renderModal()
        const advancedToggle = screen.getByRole('button', { name: /advanced/i })
        expect(advancedToggle).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(advancedToggle)
        expect(advancedToggle).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByText(/track process name/i)).toBeInTheDocument()
    })

    it('Recovery content is linked to toggle via aria-controls', () => {
        renderModal()
        const toggle = screen.getByRole('button', { name: /recovery/i })
        expect(toggle).toHaveAttribute('aria-controls', 'section-recovery')
        fireEvent.click(toggle)
        expect(document.getElementById('section-recovery')).toBeInTheDocument()
    })

    it('Advanced content is linked to toggle via aria-controls', () => {
        renderModal()
        const toggle = screen.getByRole('button', { name: /advanced/i })
        expect(toggle).toHaveAttribute('aria-controls', 'section-advanced')
        fireEvent.click(toggle)
        expect(document.getElementById('section-advanced')).toBeInTheDocument()
    })
})

describe('AppFormModal validation', () => {
    it('does not show aria-invalid on name before interaction', () => {
        renderModal()
        const input = screen.getByLabelText(/name/i)
        expect(input).not.toHaveAttribute('aria-invalid', 'true')
    })

    it('shows aria-invalid on name after blur with empty value', () => {
        renderModal()
        const input = screen.getByLabelText(/name/i)
        fireEvent.blur(input)
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows aria-invalid on exe_path after blur with empty value', () => {
        renderModal()
        const input = screen.getByLabelText(/executable/i)
        fireEvent.blur(input)
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows validation error with role=alert after blur on empty name', () => {
        renderModal()
        fireEvent.blur(screen.getByLabelText(/name/i))
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
    })

    it('marks both required fields on submit attempt with empty form', async () => {
        renderModal()
        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog.querySelector("button[type='submit']")!)
        await waitFor(() => {
            const alerts = screen.getAllByRole('alert')
            expect(alerts.length).toBeGreaterThanOrEqual(2)
        })
    })

    it('does not call onSubmit when required fields are empty', async () => {
        const onSubmit = vi.fn()
        renderModal({ onSubmit })
        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog.querySelector("button[type='submit']")!)
        await waitFor(() => screen.getAllByRole('alert'))
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('clears aria-invalid on name after user types a value', () => {
        renderModal()
        const input = screen.getByLabelText(/name/i)
        fireEvent.blur(input)
        expect(input).toHaveAttribute('aria-invalid', 'true')
        fireEvent.change(input, { target: { value: 'SimHub' } })
        expect(input).not.toHaveAttribute('aria-invalid', 'true')
    })

    it('shows API error with role=alert', async () => {
        const onSubmit = vi.fn().mockRejectedValue(new Error('backend error'))
        renderModal({ onSubmit })

        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'App' } })
        fireEvent.change(screen.getByLabelText(/executable/i), { target: { value: 'app.exe' } })

        const dialog = screen.getByRole('dialog')
        fireEvent.click(dialog.querySelector("button[type='submit']")!)

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('backend error')
        })
    })
})
