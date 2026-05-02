import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell, TopBar } from '@/components/layout'

describe('AppShell', () => {
    it('composes top bar, sidebar and main content', () => {
        render(
            <AppShell
                topBar={<div data-testid="top-bar">Top</div>}
                sidebar={<nav aria-label="Primary">Sidebar</nav>}
            >
                <section>Screen content</section>
            </AppShell>,
        )

        expect(screen.getByTestId('top-bar')).toBeInTheDocument()
        expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
        expect(screen.getByText('Screen content')).toBeInTheDocument()
    })
})

describe('TopBar', () => {
    it('shows the brand and active profile area', () => {
        render(<TopBar activeProfileName="Road" profileLabel="Active profile" />)

        expect(screen.getByTestId('pitlane-logo-icon')).toBeInTheDocument()
        expect(screen.getByText('Pitlane')).toBeInTheDocument()
        expect(screen.getByText('Active profile')).toBeInTheDocument()
        expect(screen.getByText('Road')).toBeInTheDocument()
    })
})
