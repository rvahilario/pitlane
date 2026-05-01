import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel, PanelHeader, Toolbar, Button } from '@/components/ui'

describe('Panel', () => {
    it('renders section content', () => {
        render(<Panel>Panel content</Panel>)

        expect(screen.getByText('Panel content')).toBeInTheDocument()
    })

    it('renders header title, description and action', () => {
        render(
            <Panel>
                <PanelHeader
                    title="Applications"
                    description="4 managed"
                    action={
                        <Toolbar>
                            <Button>Add</Button>
                        </Toolbar>
                    }
                />
            </Panel>,
        )

        expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument()
        expect(screen.getByText('4 managed')).toBeInTheDocument()
        expect(screen.getByRole('toolbar')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    })
})
