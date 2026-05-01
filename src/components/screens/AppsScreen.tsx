import { useState } from 'react'
import { LayoutList, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type ManagedApp, type NewApp } from '@/lib/api'
import { useApps, useAppStatuses } from '@/hooks'
import { Button, Toggle, EmptyState } from '@/components/ui'
import { AppCard, AppFormModal, ConfirmDialog } from '@/components'

type ModalState = { type: 'add' } | { type: 'edit'; app: ManagedApp } | null

export function AppsScreen() {
    const { t } = useTranslation()
    const {
        apps,
        activeProfile,
        preventAutoStop,
        refresh,
        toggleEnabled,
        toggleStopWithIracing,
        togglePreventAutoStop,
        deleteApp,
    } = useApps()
    const [modal, setModal] = useState<ModalState>(null)
    const [confirmDelete, setConfirmDelete] = useState<ManagedApp | null>(null)
    const statuses = useAppStatuses()

    async function handleFormSubmit(data: NewApp) {
        if (modal?.type === 'add') await api.addApp(data)
        else if (modal?.type === 'edit') await api.updateApp(modal.app.id, data)
        await refresh()
    }

    async function handleDelete(app: ManagedApp) {
        setConfirmDelete(null)
        await deleteApp(app)
    }

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-text">{t('apps.title')}</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                        {t('apps.profile_label', {
                            name: activeProfile?.name ?? '…',
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 py-1.5">
                        <span className="text-xs text-text-secondary">
                            <span className="font-bold text-accent">
                                {t('apps.auto_stop_label_emphasis')}
                            </span>{' '}
                            {t('apps.auto_stop_label_rest')}
                        </span>
                        <Toggle
                            checked={preventAutoStop}
                            onChange={togglePreventAutoStop}
                            label={t('apps.auto_stop_label')}
                        />
                    </div>
                    <Button onClick={() => setModal({ type: 'add' })}>
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        {t('apps.add')}
                    </Button>
                </div>
            </div>

            {/* App list */}
            {apps.length === 0 ? (
                <EmptyState
                    icon={LayoutList}
                    message={t('apps.empty')}
                    action={
                        <Button onClick={() => setModal({ type: 'add' })}>
                            {t('apps.add_first')}
                        </Button>
                    }
                />
            ) : (
                <ul className="flex flex-col gap-2">
                    {apps.map((app) => (
                        <AppCard
                            key={app.id}
                            app={app}
                            status={statuses.find((s) => s.app_id === app.id)}
                            onStart={() => api.forceLaunchApp(app.id)}
                            onStop={() => api.forceKillApp(app.id)}
                            onEdit={() => setModal({ type: 'edit', app })}
                            onDelete={() => setConfirmDelete(app)}
                            onToggleEnabled={(enabled) => toggleEnabled(app, enabled)}
                            onToggleStopWithIracing={(stop) =>
                                toggleStopWithIracing(app, stop)
                            }
                        />
                    ))}
                </ul>
            )}

            {modal && (
                <AppFormModal
                    mode={modal.type}
                    initial={modal.type === 'edit' ? modal.app : undefined}
                    onClose={() => setModal(null)}
                    onSubmit={handleFormSubmit}
                />
            )}

            {confirmDelete && (
                <ConfirmDialog
                    title={t('apps.delete_confirm_title')}
                    message={t('apps.delete_confirm_message', {
                        name: confirmDelete.name,
                    })}
                    confirmLabel={t('apps.delete_confirm')}
                    onConfirm={() => handleDelete(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    )
}
