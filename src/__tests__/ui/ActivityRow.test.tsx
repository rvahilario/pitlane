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
        expect(screen.getByText('LAUNCH')).toBeInTheDocument()
        expect(screen.getByText('SimHub')).toBeInTheDocument()
        expect(screen.getByText('Started successfully')).toBeInTheDocument()
    })

    it('applies event variant classes', () => {
        render(<ActivityRow time="10:24:45" event="STOP" variant="stop" />)

        expect(screen.getByText('STOP').className).toContain('text-warning')
    })
})
