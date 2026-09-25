import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

export type Currency = 'USD' | 'PEN' | 'EUR'
export type TimeUnit = 'hours' | 'days'
export type Density = 'compacto' | 'comodo' | 'espacioso'

export interface Preferences {
  currency: Currency
  timeUnit: TimeUnit
  density: Density
  onboardingSeen: boolean
}

interface PreferencesContextValue {
  preferences: Preferences
  updatePreferences: (key: keyof Preferences, value: string | boolean) => void
  resetPreferences: () => void
}

const STORAGE_KEY = 'cloudops-preferences'

const DEFAULT_PREFERENCES: Preferences = {
  currency: 'USD',
  timeUnit: 'days',
  density: 'comodo',
  onboardingSeen: false
}

function getInitialPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(stored) as Partial<Preferences>
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  PEN: 'S/',
  EUR: '€'
}

const currencyRates: Record<Currency, number> = {
  USD: 1,
  PEN: 3.75,
  EUR: 0.92
}

export function formatCurrency(amountInUsd: number, currency: Currency): string {
  const converted = amountInUsd * currencyRates[currency]
  const formatted = new Intl.NumberFormat('es', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amountInUsd < 100 ? 2 : 0
  }).format(converted)
  return `${currencySymbols[currency]} ${formatted}`
}

export function formatTime(hours: number, unit: TimeUnit): string {
  if (unit === 'days') {
    if (hours < 24) return `${hours} h`
    const days = hours / 24
    return `${days % 1 === 0 ? days : days.toFixed(1)} días`
  }
  return `${hours} h`
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // storage no disponible
    }
  }, [preferences])

  const updatePreferences = useCallback((key: keyof Preferences, value: string | boolean) => {
    setPreferences((previous) => ({ ...previous, [key]: value }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
  }, [])

  const value = useMemo(
    () => ({ preferences, updatePreferences, resetPreferences }),
    [preferences, updatePreferences, resetPreferences]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences debe usarse dentro de un PreferencesProvider')
  }
  return context
}

export function useFormatters() {
  const { preferences } = usePreferences()
  const formatters = useMemo(() => {
    const currency = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: preferences.currency,
      maximumFractionDigits: 2
    })
    const currency0 = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: preferences.currency,
      maximumFractionDigits: 0
    })
    return {
      currency,
      currency0,
      formatCurrency: (amountInUsd: number) => formatCurrency(amountInUsd, preferences.currency),
      formatTime: (hours: number) => formatTime(hours, preferences.timeUnit)
    }
  }, [preferences.currency, preferences.timeUnit])
  return formatters
}