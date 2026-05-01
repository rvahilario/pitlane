import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckCircle2 } from 'lucide-react'
import { MetricTile } from '@/components/ui'

describe('MetricTile', () => {
    it('renders label and value', () => {
        render(<MetricTile label="Ready" value="3 / 4" icon={CheckCircle2} variant="success" />)

        expect(screen.getByText('Ready')).toBeInTheDocument()
        expect(screen.getByText('3 / 4')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
        render(<MetricTile label="Crashed" value="1" variant="warning" />)

        expect(screen.getByText('1').parentElement?.className).toContain('border-warning')
    })
})
