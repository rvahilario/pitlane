import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell, BottomStatusBar, TopBar } from '@/components/layout'

describe('AppShell', () => {
    it('composes top bar, sidebar, main content and bottom status bar', () => {
        render(
            <AppShell
                topBar={<div data-testid="top-bar">Top</div>}
                sidebar={<nav aria-label="Primary">Sidebar</nav>}
                bottomBar={<div data-testid="bottom-bar">Bottom</div>}
            >
                <section>Screen content</section>
            </AppShell>,
        )

        expect(screen.getByTestId('top-bar')).toBeInTheDocument()
        expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
        expect(screen.getByText('Screen content')).toBeInTheDocument()
        expect(screen.getByTestId('bottom-bar')).toBeInTheDocument()
    })
})

describe('TopBar', () => {
    it('shows the brand and active profile area', () => {
        render(<TopBar activeProfileName="Road" profileLabel="Active profile" />)

        expect(screen.getByText('Pitlane')).toBeInTheDocument()
        expect(screen.getByText('Active profile')).toBeInTheDocument()
        expect(screen.getByText('Road')).toBeInTheDocument()
    })
})

describe('BottomStatusBar', () => {
    it('shows operational status, managed apps and active profile', () => {
        render(
            <BottomStatusBar
                activeProfileName="Road"
                iRacingRunning
                managedLabel="2 managed apps"
                paused={false}
                pausedLabel="PAUSED"
                profileLabel="Profile"
                sessionLabel="iRacing open"
            />,
        )

        expect(screen.getByTestId('iracing-status')).toHaveTextContent('iRacing open')
        expect(screen.getByText('2 managed apps')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Road')).toBeInTheDocument()
    })

    it('shows paused state when provided', () => {
        render(
            <BottomStatusBar
                activeProfileName={null}
                iRacingRunning={false}
                managedLabel="0 managed apps"
                paused
                pausedLabel="PAUSED"
                profileLabel="Profile"
                sessionLabel="iRacing offline"
            />,
        )

        expect(screen.getByText('PAUSED')).toBeInTheDocument()
    })
})
