import { useEffect, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Boxes, Globe, RotateCcw, Server, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { Region, RegionStatus } from '../types/cloud'
import StatusBadge from './StatusBadge'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const WORLD_CENTER: [number, number] = [0, 12]
const WORLD_ZOOM = 1
const FOCUS_ZOOM = 3.2
const ANIMATION_DURATION = 850

const REGION_COORDS: Record<string, [number, number]> = {
  'us-east-1': [-78.65, 37.4],
  'sa-east-1': [-46.63, -23.55],
  'eu-west-1': [-6.26, 53.35],
  'ap-southeast-1': [103.82, 1.35]
}

const STATUS_LIGHT: Record<RegionStatus, string> = {
  operational: '#16A34A',
  degraded: '#F59E0B',
  down: '#DC2626'
}

const STATUS_DARK: Record<RegionStatus, string> = {
  operational: '#22C55E',
  degraded: '#FBBF24',
  down: '#F87171'
}

const STATUS_LABELS: Record<RegionStatus, string> = {
  operational: 'Operativa',
  degraded: 'Degradada',
  down: 'Caída'
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface RegionMapProps {
  regions: Region[]
}

interface FloatView {
  center: [number, number]
  zoom: number
}

export default function RegionMap({ regions }: RegionMapProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [view, setView] = useState<FloatView>({ center: WORLD_CENTER, zoom: WORLD_ZOOM })
  const [selected, setSelected] = useState<Region | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const viewRef = useRef<FloatView>({ center: WORLD_CENTER, zoom: WORLD_ZOOM })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const maxServers = regions.reduce((max, region) => Math.max(max, region.serversDeployed), 1)
  const landFill = isDark ? '#334155' : '#E2E8F0'
  const landHoverFill = isDark ? '#475569' : '#CBD5E1'
  const landStroke = isDark ? '#0F172A' : '#FFFFFF'
  const statusColor = (status: RegionStatus) => (isDark ? STATUS_DARK : STATUS_LIGHT)[status]

  function animateTo(targetCenter: [number, number], targetZoom: number) {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const from = viewRef.current
    const startTime = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / ANIMATION_DURATION)
      const eased = easeInOutCubic(progress)
      setView({
        center: [
          from.center[0] + (targetCenter[0] - from.center[0]) * eased,
          from.center[1] + (targetCenter[1] - from.center[1]) * eased
        ],
        zoom: from.zoom * Math.pow(targetZoom / from.zoom, eased)
      })

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = window.requestAnimationFrame(step)
  }

  function handleSelect(region: Region) {
    setSelected(region)
    animateTo(REGION_COORDS[region.id] ?? WORLD_CENTER, FOCUS_ZOOM)
  }

  function handleReset() {
    setSelected(null)
    animateTo(WORLD_CENTER, WORLD_ZOOM)
  }

  function handleMoveEnd(props: { coordinates?: [number, number] | null; zoom?: number }) {
    if (props.coordinates && props.zoom) {
      viewRef.current = { center: props.coordinates, zoom: props.zoom }
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <Globe className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Mapa de regiones
          </h2>
          <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
            Haz clic en un marcador para inspeccionar la región y acercarla.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-textPrimary transition-all hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/40"
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer vista
        </button>
      </div>

      <div className="relative mt-4 h-56 border-t border-border pb-6 dark:border-darkBorder sm:h-72 sm:pb-8 md:h-80 md:pb-10 lg:h-96 xl:h-[28rem]">
        <ComposableMap projection="geoEqualEarth" width={1000} height={480} className="h-full w-full">
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={hoveredKey === geo.rsmKey ? landHoverFill : landFill}
                    stroke={landStroke}
                    strokeWidth={0.4}
                    className="transition-colors duration-150"
                    onMouseEnter={() => setHoveredKey(geo.rsmKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                ))
              }
            </Geographies>

            {regions.map((region) => {
              const coords = REGION_COORDS[region.id]
              if (!coords) return null
              const color = statusColor(region.status)
              const isActive = selected?.id === region.id
              const radius = 7 + (region.serversDeployed / maxServers) * 8
              const iconSize = Math.round(radius * 1.1)

              return (
                <Marker key={region.id} coordinates={coords} onClick={() => handleSelect(region)}>
                  <g className="cursor-pointer">
                    <circle r={radius + 5} fill={color} opacity={isActive ? 0.25 : 0.12} />
                    {isActive && (
                      <circle
                        r={radius + 10}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        opacity={0.5}
                      />
                    )}
                    <circle
                      r={radius}
                      fill={color}
                      stroke="#FFFFFF"
                      strokeOpacity={0.9}
                      strokeWidth={1.5}
                    />
                    <Server
                      size={iconSize}
                      strokeWidth={2.2}
                      className="pointer-events-none text-white"
                      style={{ transform: `translate(${-iconSize / 2}px, ${-iconSize / 2}px)` }}
                    />
                  </g>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden flex-wrap items-center gap-3 rounded-full bg-white/85 px-3.5 py-2 text-xs font-medium text-textSecondary shadow-sm backdrop-blur dark:bg-darkCard/85 dark:text-darkTextSecondary sm:flex">
          {(['operational', 'degraded', 'down'] as RegionStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: statusColor(status) }}
              />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:bottom-4 sm:left-4 sm:right-auto">
          {selected ? (
            <div className="pointer-events-auto w-full max-w-xs rounded-2xl border border-border bg-white/95 p-4 shadow-xl backdrop-blur dark:border-darkBorder dark:bg-darkCard/95">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-textPrimary dark:text-darkTextPrimary">
                    {selected.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-textSecondary dark:text-darkTextSecondary">
                    {selected.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Cerrar detalles de la región"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-textSecondary transition-colors hover:bg-danger/10 hover:text-danger dark:text-darkTextSecondary dark:hover:bg-darkDanger/10 dark:hover:text-darkDanger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-background p-2.5 dark:bg-darkBackground">
                  <p className="flex items-center gap-1 text-[11px] text-textSecondary dark:text-darkTextSecondary">
                    <Server className="h-3 w-3" />
                    Servidores
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-textPrimary dark:text-darkTextPrimary">
                    {selected.serversDeployed}
                  </p>
                </div>
                <div className="rounded-xl bg-background p-2.5 dark:bg-darkBackground">
                  <p className="flex items-center gap-1 text-[11px] text-textSecondary dark:text-darkTextSecondary">
                    <Boxes className="h-3 w-3" />
                    Servicios activos
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-textPrimary dark:text-darkTextPrimary">
                    {selected.deployedServices.length}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-medium text-textSecondary shadow-sm backdrop-blur dark:bg-darkCard/85 dark:text-darkTextSecondary"
            >
              <Globe className="h-3.5 w-3.5" />
              Haz clic en un marcador para ver los detalles
            </span>
          )}
        </div>
      </div>
    </section>
  )
}