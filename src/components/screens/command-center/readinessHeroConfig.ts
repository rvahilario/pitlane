import type { ElementType } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import type { Readiness } from '@/lib/command-center'

export type ReadinessConfig = {
    icon: ElementType
    headingClass: string
    orbClass: string
    orbRimGlowClass: string
    orbSurfaceClass: string
    pillClass: string
    glowClass: string | null
}

export type HeroConfig = ReadinessConfig & {
    readiness: Readiness
}

const READINESS_CONFIG: Record<Readiness, ReadinessConfig> = {
    ready: {
        icon: Check,
        headingClass: 'text-success',
        orbClass:
            'border-success shadow-[0_0_34px_rgba(71,209,140,0.46),0_0_86px_rgba(71,209,140,0.22)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(216,255,251,0.42)_0%,rgba(216,255,251,0.22)_9%,rgba(71,209,140,0.14)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(216,255,251,0.32),transparent_28%),linear-gradient(145deg,rgba(71,209,140,0.92)_0%,rgba(39,155,99,0.54)_38%,rgba(6,19,12,0.98)_100%)] shadow-[inset_0_0_24px_rgba(216,255,251,0.16),inset_18px_22px_54px_rgba(6,19,12,0.72),inset_-14px_-18px_42px_rgba(2,7,7,0.50)]',
        pillClass: 'border-success/50 bg-success/10 text-success',
        glowClass: 'from-success/20',
    },
    needs_attention: {
        icon: AlertTriangle,
        headingClass: 'text-warning',
        orbClass:
            'border-warning shadow-[0_0_34px_rgba(242,201,76,0.44),0_0_86px_rgba(242,201,76,0.20)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(255,244,190,0.42)_0%,rgba(255,224,130,0.24)_9%,rgba(242,201,76,0.14)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(255,224,130,0.34),transparent_28%),linear-gradient(145deg,rgba(242,201,76,0.92)_0%,rgba(171,128,20,0.56)_38%,rgba(23,17,4,0.98)_100%)] shadow-[inset_0_0_24px_rgba(255,224,130,0.18),inset_18px_22px_54px_rgba(23,17,4,0.74),inset_-14px_-18px_42px_rgba(23,17,4,0.52)]',
        pillClass: 'border-warning/50 bg-warning/10 text-warning',
        glowClass: 'from-warning/15',
    },
    no_iracing: {
        icon: X,
        headingClass: 'text-text-muted',
        orbClass:
            'border-border shadow-[0_0_28px_rgba(169,153,211,0.24),0_0_70px_rgba(51,38,79,0.24)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(244,240,255,0.28)_0%,rgba(209,197,242,0.16)_9%,rgba(169,153,211,0.10)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(244,240,255,0.10),transparent_26%),linear-gradient(145deg,rgba(169,153,211,0.30)_0%,rgba(51,38,79,0.38)_38%,rgba(9,7,20,0.62)_100%)] shadow-[inset_0_0_12px_rgba(244,240,255,0.02),inset_12px_16px_30px_rgba(9,7,20,0.05),inset_-8px_-10px_24px_rgba(9,7,20,0.03)]',
        pillClass: 'border-border text-text-muted',
        glowClass: null,
    },
}

export function readinessConfig(readiness: Readiness): HeroConfig {
    return {
        readiness,
        ...READINESS_CONFIG[readiness],
    }
}
