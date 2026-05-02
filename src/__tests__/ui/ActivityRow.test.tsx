import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityRow } from '@/components/ui'

describe('ActivityRow', () => {
    it('renders activity details', () => {
        render(
            <ActivityRow
                time="10:24:45"
                event="LAUNCH"
                source="SimHub"
                message="Started successfully"
                variant="launch"
            />,
        )

        expect(screen.getByText('10:24:45')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: 'LAUNCH' })).toBeInTheDocument()
        expect(screen.getByText('SimHub')).toBeInTheDocument()
        expect(screen.getByText('Started successfully')).toBeInTheDocument()
    })

    it('applies stop variant with muted color', () => {
        render(<ActivityRow time="10:24:45" event="STOP" variant="stop" />)

        const icon = screen.getByRole('img', { name: 'STOP' })
        expect(icon.getAttribute('class')).toContain('text-text-muted')
    })

    it('applies launch variant with success color', () => {
        render(<ActivityRow time="10:24:45" event="LAUNCH" variant="launch" />)

        const icon = screen.getByRole('img', { name: 'LAUNCH' })
        expect(icon.getAttribute('class')).toContain('text-success')
    })

    it('applies error variant with danger color', () => {
        render(<ActivityRow time="10:24:45" event="ERROR" variant="error" />)

        const icon = screen.getByRole('img', { name: 'ERROR' })
        expect(icon.getAttribute('class')).toContain('text-danger')
    })
})
