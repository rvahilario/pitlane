import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const appVersion = packageJson.version as string

export default defineConfig({
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    test: {
        environment: 'jsdom',
        globals: true,
        clearMocks: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/test/**', 'src/main.tsx', 'src/i18n/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
