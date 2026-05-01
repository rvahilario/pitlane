import { useEffect, useRef, useState } from 'react'

interface DropdownProps {
    trigger: (open: boolean) => React.ReactNode
    children: React.ReactNode
}

export function Dropdown({ trigger, children }: DropdownProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const toggleOpen = () => setOpen((prev) => !prev)

    return (
        <div ref={ref} className="relative">
            <div onClick={toggleOpen}>{trigger(open)}</div>
            {open && (
                <div
                    className="absolute right-0 top-full mt-1.5 z-50 bg-elevated border border-border-strong rounded-lg shadow-xl min-w-[152px] py-1 overflow-hidden"
                    onClick={() => setOpen(false)}
                >
                    {children}
                </div>
            )}
        </div>
    )
}
