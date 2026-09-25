import { useState } from 'react'
import { Compass, DollarSign, MapPin, MousePointerClick, X } from 'lucide-react'
import { usePreferences } from '../hooks/usePreferences'

interface Step {
  icon: typeof Compass
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: Compass,
    title: 'Bienvenido a CloudOps',
    description:
      'Panel de monitoreo de tu infraestructura cloud con simulación de costos, red, seguridad y servicios AWS.'
  },
  {
    icon: MousePointerClick,
    title: 'Navegación',
    description:
      'Usa el menú lateral para moverte entre módulos. Pulsa la tecla "/" en cualquier pantalla para enfocar el buscador.'
  },
  {
    icon: MapPin,
    title: 'Módulos clave',
    description:
      'Costos muestra desglose on-demand/reservado y comparativas; Red simula flujo de tráfico y logs; Seguridad incluye hardening.'
  },
  {
    icon: DollarSign,
    title: 'Preferencias',
    description:
      'Abre Configuración para cambiar la moneda, la unidad de tiempo y la densidad de la interfaz.'
  }
]

export default function OnboardingTour() {
  const { preferences, updatePreferences } = usePreferences()
  const [current, setCurrent] = useState(0)

  if (preferences.onboardingSeen) return null

  const step = steps[current]

  function close() {
    updatePreferences('onboardingSeen', true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:border-darkBorder dark:bg-darkCard">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
            <step.icon className="h-6 w-6" />
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar tour"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-textSecondary transition-colors hover:bg-danger/10 hover:text-danger dark:text-darkTextSecondary dark:hover:bg-darkDanger/10 dark:hover:text-darkDanger"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-5 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
          {step.description}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === current
                    ? 'w-6 bg-primary dark:bg-darkPrimary'
                    : 'w-1.5 bg-textSecondary/30 dark:bg-darkTextSecondary/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {current < steps.length - 1 && (
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-textSecondary transition-colors hover:text-textPrimary dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
              >
                Omitir
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (current === steps.length - 1) {
                  close()
                } else {
                  setCurrent((previous) => previous + 1)
                }
              }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-darkPrimary"
            >
              {current === steps.length - 1 ? 'Comenzar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}