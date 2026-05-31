import { open } from '@tauri-apps/plugin-dialog'

export async function pickExecutable(): Promise<string | null> {
    const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Executable', extensions: ['exe'] }],
    })
    if (Array.isArray(selected)) {
        return selected[0] ?? null
    }
    return selected
}
