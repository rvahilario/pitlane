import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from '@/components/ui'

describe('StatusPill', () => {
    it('renders status text', () => {
        render(<StatusPill variant="running">Running</StatusPill>)

        expect(screen.getByText('Running')).toBeInTheDocument()
    })

    it('applies semantic variant classes', () => {
        render(<StatusPill variant="crashed">Crashed</StatusPill>)

        expect(screen.getByText('Crashed').className).toContain('text-warning')
    })
})
