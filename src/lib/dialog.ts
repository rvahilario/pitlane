import { open } from '@tauri-apps/plugin-dialog'

export async function pickExecutable(defaultPath?: string): Promise<string | null> {
    const selected = await open({
        multiple: false,
        directory: false,
        defaultPath,
        filters: [{ name: 'Executable', extensions: ['exe'] }],
    })
    if (Array.isArray(selected)) {
        return selected[0] ?? null
    }
    return selected
}
