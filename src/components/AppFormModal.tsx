import { useState } from 'react'
import { Check, ChevronDown, FolderOpen, Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { type ManagedApp, type NewApp } from '@/lib/api'
import { pickExecutable } from '@/lib/dialog'
import { Button, Modal, TextInput, NumberInput, Checkbox, SectionDivider } from '@/components/ui'
import { FormField } from '@/components/layout'

interface AppFormModalProps {
    mode: 'add' | 'edit'
    initial?: ManagedApp
    onClose: () => void
    onSubmit: (data: NewApp) => Promise<void>
}

interface FormState {
    name: string
    exe_path: string
    enabled: boolean
    startup_delay_secs: number
    args: string
    working_dir: string
    restart_on_crash: boolean
    max_restart_attempts: number
    track_process_name: string
    force_kill_on_stop: boolean
    kill_process_tree: boolean
    stop_with_iracing: boolean
}

function initForm(initial?: ManagedApp): FormState {
    return {
        name: initial?.name ?? '',
        exe_path: initial?.exe_path ?? '',
        enabled: initial?.enabled ?? true,
        startup_delay_secs: initial?.startup_delay_secs ?? 0,
        args: initial?.args ?? '',
        working_dir: initial?.working_dir ?? '',
        restart_on_crash: initial?.restart_on_crash ?? false,
        max_restart_attempts: initial?.max_restart_attempts ?? 3,
        track_process_name: initial?.track_process_name ?? '',
        force_kill_on_stop: initial?.force_kill_on_stop ?? false,
        kill_process_tree: initial?.kill_process_tree ?? false,
        stop_with_iracing: initial?.stop_with_iracing ?? true,
    }
}

export function AppFormModal({ mode, initial, onClose, onSubmit }: AppFormModalProps) {
    const { t } = useTranslation()
    const [form, setForm] = useState<FormState>(initForm(initial))
    const [recoveryOpen, setRecoveryOpen] = useState(false)
    const [advancedOpen, setAdvancedOpen] = useState(false)
    const [touched, setTouched] = useState<Set<'name' | 'exe_path'>>(new Set())
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const toggleRecovery = () => setRecoveryOpen((prev) => !prev)
    const toggleAdvanced = () => setAdvancedOpen((prev) => !prev)

    function markTouched(field: 'name' | 'exe_path') {
        setTouched((prev) => new Set(prev).add(field))
    }

    async function handleBrowseExe() {
        const defaultDir = form.exe_path.trim()
            ? form.exe_path.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
            : undefined
        const path = await pickExecutable(defaultDir)
        if (path) {
            patch('exe_path', path)
            if (!form.working_dir.trim()) {
                const dir = path.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
                patch('working_dir', dir)
            }
        }
    }

    function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }))
    }

    const nameInvalid = touched.has('name') && !form.name.trim()
    const exePathInvalid = touched.has('exe_path') && !form.exe_path.trim()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim() || !form.exe_path.trim()) {
            setTouched(new Set(['name', 'exe_path']))
            return
        }
        setSaving(true)
        setError(null)
        try {
            await onSubmit({
                name: form.name,
                exe_path: form.exe_path,
                enabled: form.enabled,
                startup_delay_secs: form.startup_delay_secs,
                args: form.args,
                working_dir: form.working_dir,
                restart_on_crash: form.restart_on_crash,
                max_restart_attempts: form.max_restart_attempts,
                track_process_name: form.track_process_name,
                force_kill_on_stop: form.force_kill_on_stop,
                kill_process_tree: form.kill_process_tree,
                stop_with_iracing: form.stop_with_iracing,
            })
            setSaved(true)
            setTimeout(onClose, 600)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal onClickOutside={onClose}>
            <div className="bg-surface border border-border-strong rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h3 className="text-sm font-semibold text-text">
                        {mode === 'add' ? t('apps.form.title_add') : t('apps.form.title_edit')}
                    </h3>
                    <Button variant="icon" onClick={onClose} aria-label="close">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Scrollable body */}
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="flex flex-col gap-4 p-5 overflow-y-auto">
                        {/* Basic */}
                        <SectionDivider title={t('apps.form.section_basic')} />

                        <FormField
                            label={t('apps.form.name')}
                            id="app-form-name"
                            error={nameInvalid ? t('apps.form.name_required') : undefined}
                        >
                            <TextInput
                                id="app-form-name"
                                value={form.name}
                                onChange={(v) => patch('name', v)}
                                aria-invalid={nameInvalid}
                                onBlur={() => markTouched('name')}
                            />
                        </FormField>

                        <FormField
                            label={t('apps.form.exe_path')}
                            id="app-form-exe"
                            error={exePathInvalid ? t('apps.form.exe_path_required') : undefined}
                        >
                            <div className="flex gap-2">
                                <TextInput
                                    id="app-form-exe"
                                    value={form.exe_path}
                                    onChange={(v) => patch('exe_path', v)}
                                    mono
                                    aria-invalid={exePathInvalid}
                                    onBlur={() => markTouched('exe_path')}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleBrowseExe}
                                    aria-label={t('apps.form.browse')}
                                    title={t('apps.form.browse')}
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </Button>
                            </div>
                        </FormField>

                        <Checkbox
                            label={t('apps.form.enabled')}
                            checked={form.enabled}
                            onChange={(v) => patch('enabled', v)}
                        />
                        <Checkbox
                            label={t('apps.auto_stop')}
                            checked={form.stop_with_iracing}
                            onChange={(v) => patch('stop_with_iracing', v)}
                        />

                        {/* Launch */}
                        <SectionDivider title={t('apps.form.section_launch')} />

                        <FormField label={t('apps.form.startup_delay')}>
                            <NumberInput
                                value={form.startup_delay_secs}
                                onChange={(v) => patch('startup_delay_secs', v)}
                                step={0.5}
                            />
                        </FormField>

                        <FormField label={t('apps.form.args')}>
                            <TextInput value={form.args} onChange={(v) => patch('args', v)} mono />
                        </FormField>

                        <FormField
                            label={
                                <span className="flex items-center gap-1">
                                    {t('apps.form.working_dir')}
                                    <span
                                        title={t('apps.form.working_dir_hint')}
                                        className="inline-flex cursor-help"
                                    >
                                        <Info className="w-3 h-3 text-text-muted" />
                                    </span>
                                </span>
                            }
                            id="app-form-working-dir"
                        >
                            <TextInput
                                id="app-form-working-dir"
                                value={form.working_dir}
                                onChange={(v) => patch('working_dir', v)}
                                mono
                            />
                        </FormField>

                        {/* Recovery (collapsible, closed by default) */}
                        <button
                            type="button"
                            aria-expanded={recoveryOpen}
                            aria-controls="section-recovery"
                            onClick={toggleRecovery}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors self-start"
                        >
                            <ChevronDown
                                className={cn(
                                    'w-3.5 h-3.5 transition-transform',
                                    recoveryOpen && 'rotate-180',
                                )}
                            />
                            {t('apps.form.section_recovery')}
                        </button>

                        {recoveryOpen && (
                            <div
                                id="section-recovery"
                                className="flex flex-col gap-4 pl-3 border-l border-border"
                            >
                                <Checkbox
                                    label={t('apps.form.restart_on_crash')}
                                    checked={form.restart_on_crash}
                                    onChange={(v) => patch('restart_on_crash', v)}
                                />

                                {form.restart_on_crash && (
                                    <FormField label={t('apps.form.max_retries')}>
                                        <NumberInput
                                            value={form.max_restart_attempts}
                                            onChange={(v) => patch('max_restart_attempts', v)}
                                            min={1}
                                        />
                                    </FormField>
                                )}
                            </div>
                        )}

                        {/* Advanced (collapsible, closed by default) */}
                        <button
                            type="button"
                            aria-expanded={advancedOpen}
                            aria-controls="section-advanced"
                            onClick={toggleAdvanced}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors self-start"
                        >
                            <ChevronDown
                                className={cn(
                                    'w-3.5 h-3.5 transition-transform',
                                    advancedOpen && 'rotate-180',
                                )}
                            />
                            {t('apps.form.section_advanced')}
                        </button>

                        {advancedOpen && (
                            <div
                                id="section-advanced"
                                className="flex flex-col gap-4 pl-3 border-l border-border"
                            >
                                <FormField
                                    label={t('apps.form.track_process_name')}
                                    hint={t('apps.form.track_process_name_hint')}
                                >
                                    <TextInput
                                        value={form.track_process_name}
                                        onChange={(v) => patch('track_process_name', v)}
                                        mono
                                    />
                                </FormField>
                                <Checkbox
                                    label={t('apps.form.force_kill')}
                                    hint={t('apps.form.force_kill_hint')}
                                    checked={form.force_kill_on_stop}
                                    onChange={(v) => patch('force_kill_on_stop', v)}
                                />
                                <Checkbox
                                    label={t('apps.form.kill_tree')}
                                    hint={t('apps.form.kill_tree_hint')}
                                    checked={form.kill_process_tree}
                                    onChange={(v) => patch('kill_process_tree', v)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-2 px-5 py-4 border-t border-border shrink-0">
                        {error && (
                            <p role="alert" className="text-xs text-danger">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={saving || saved}
                            >
                                {t('apps.form.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant={saved ? 'success' : 'accent'}
                                disabled={saving || saved}
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        {t('apps.form.saved')}
                                    </>
                                ) : saving ? (
                                    '…'
                                ) : (
                                    t('apps.form.save')
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    )
}
