import { useEffect, useState } from 'react'
import { Activity, ArrowDown, ArrowUp, Gauge, Radio, Wifi } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useTheme } from '../hooks/useTheme'
import type { CloudServer } from '../types/cloud'

interface MetricSample {
  time: string
  cpu: number
  latency: number
  bandwidth: number
}

interface MetricDefinition {
  key: 'cpu' | 'latency' | 'bandwidth'
  label: string
  unit: string
  icon: typeof Activity
  color: string
  colorLight: string
  decimals: number
}

const metricDefinitions: MetricDefinition[] = [
  { key: 'cpu', label: 'Uso de CPU', unit: '%', icon: Gauge, color: '#2dd4bf', colorLight: '#0d9488', decimals: 1 },
  { key: 'latency', label: 'Latencia', unit: 'ms', icon: Activity, color: '#60a5fa', colorLight: '#2563eb', decimals: 0 },
  { key: 'bandwidth', label: 'Ancho de banda', unit: 'Mbps', icon: Wifi, color: '#fbbf24', colorLight: '#d97706', decimals: 1 }
]

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function targetValues(serverCount: number, trafficLoad: boolean) {
  return {
    cpu: clamp(22 + serverCount * 1.35 + (trafficLoad ? 22 : 0), 8, 88),
    latency: clamp(34 + serverCount * 1.1 + (trafficLoad ? 32 : 0), 18, 240),
    bandwidth: clamp(12 + serverCount * 5.2 + (trafficLoad ? 38 : 0), 4, 420)
  }
}

function makeInitialSamples(serverCount: number, trafficLoad: boolean): MetricSample[] {
  const target = targetValues(serverCount, trafficLoad)
  const now = Date.now()
  return Array.from({ length: 24 }, (_, index) => {
    const variation = (phase: number, amount: number) =>
      Math.sin(index / 3.2 + phase) * amount + Math.cos(index / 6.1 + phase) * amount * 0.35
    return {
      time: new Date(now - (23 - index) * 2000).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      cpu: clamp(target.cpu + variation(0.2, 4.2), 4, 96),
      latency: clamp(target.latency + variation(1.6, 7.5), 10, 280),
      bandwidth: clamp(target.bandwidth + variation(2.7, Math.max(2, target.bandwidth * 0.08)), 0, 500)
    }
  })
}

function nextValue(current: number, target: number, variationPercent: number, min: number, max: number) {
  const variation = (Math.random() * 2 - 1) * variationPercent
  const drift = (target - current) * 0.08
  return clamp(current * (1 + variation) + drift, min, max)
}

function MetricPanel({ definition, samples }: { definition: MetricDefinition; samples: MetricSample[] }) {
  const isDark = useTheme().theme === 'dark'
  const color = isDark ? definition.color : definition.colorLight
  const Icon = definition.icon
  const latest = samples[samples.length - 1]?.[definition.key] ?? 0
  const previous = samples[samples.length - 2]?.[definition.key] ?? latest
  const isRising = latest >= previous
  const value = latest.toFixed(definition.decimals)

  return (
    <div className="min-w-0 px-4 py-4 first:pl-0 last:pr-0 md:border-l md:border-border dark:md:border-slate-700 md:first:border-0 md:md:pl-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-textSecondary dark:text-slate-300">
          <Icon className="h-4 w-4" style={{ color }} />
          {definition.label}
        </p>
        <span className={`inline-flex items-center gap-0.5 text-[11px] ${isRising ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
          {isRising ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(latest - previous).toFixed(definition.decimals)}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-textPrimary dark:text-white">
        {value}<span className="ml-1 text-sm font-normal text-textSecondary dark:text-slate-400">{definition.unit}</span>
      </p>
      <div className="mt-2 h-16 w-full" aria-label={`${definition.label} en tiempo real`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={samples} margin={{ top: 4, right: 1, bottom: 0, left: 1 }}>
            <defs>
              <linearGradient id={`metric-fill-${definition.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={definition.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#metric-fill-${definition.key})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-textSecondary dark:text-slate-500">Últimos 48 segundos</p>
    </div>
  )
}

export default function CloudWatchMetrics({
  servers,
  trafficLoad
}: {
  servers: CloudServer[]
  trafficLoad: boolean
}) {
  const serverCount = servers.filter((server) => server.status === 'active').length
  const [samples, setSamples] = useState(() => makeInitialSamples(serverCount, trafficLoad))

  useEffect(() => {
    setSamples(makeInitialSamples(serverCount, trafficLoad))
    const timer = window.setInterval(() => {
      setSamples((current) => {
        const previous = current[current.length - 1] ?? makeInitialSamples(serverCount, trafficLoad)[0]
        const targets = targetValues(serverCount, trafficLoad)
        const next: MetricSample = {
          time: new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          cpu: nextValue(previous.cpu, targets.cpu, 0.035, 4, 96),
          latency: nextValue(previous.latency, targets.latency, 0.045, 10, 280),
          bandwidth: nextValue(previous.bandwidth, targets.bandwidth, 0.07, 0, 500)
        }
        return [...current.slice(-23), next]
      })
    }, 2000)
    return () => window.clearInterval(timer)
  }, [serverCount, trafficLoad])

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface text-textPrimary shadow-card dark:border-slate-700 dark:bg-[#0b1d38] dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-slate-700">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-textPrimary dark:text-white">
            <Activity className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            Monitoreo de rendimiento
            <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
              En vivo
            </span>
          </h2>
          <p className="mt-1 text-xs text-textSecondary dark:text-slate-400">Muestras cada 2 segundos · variación porcentual acotada</p>
        </div>
        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold leading-4 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          <Radio className="h-3.5 w-3.5 shrink-0" />
          Fuente: Datos Semisimulados (Plataforma Externa)
        </span>
      </header>
      <div className="grid grid-cols-1 divide-y divide-border px-5 dark:divide-slate-700 md:grid-cols-3 md:divide-x md:divide-y-0">
        {metricDefinitions.map((definition) => (
          <MetricPanel key={definition.key} definition={definition} samples={samples} />
        ))}
      </div>
    </section>
  )
}