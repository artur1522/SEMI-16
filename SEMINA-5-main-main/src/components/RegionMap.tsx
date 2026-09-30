import { useEffect, useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from 'react-simple-maps'
import { Crosshair, Globe, MapPin, RotateCcw, Server } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useLocalLocation } from '../hooks/useLocalLocation'
import { deriveMetrics } from '../store/cloudStore'
import type { CloudServer, Region, RegionStatus } from '../types/cloud'
import RegionDetailModal from './RegionDetailModal'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const WORLD_CENTER: [number, number] = [0, 12]
const WORLD_ZOOM = 1
const FOCUS_ZOOM = 3.2
const ANIMATION_DURATION = 850

const REGION_COORDS: Record<string, [number, number]> = {
  'us-west-2': [-119.7, 45.8],
  'us-east-1': [-78.65, 37.4],
  'sa-east-1': [-46.63, -23.55],
  'eu-west-1': [-6.26, 53.35],
  'eu-central-1': [8.68, 50.11],
  'ap-south-1': [72.88, 19.07],
  'ap-southeast-1': [103.82, 1.35],
  'ap-northeast-1': [139.69, 35.68]
}

const REGION_LABELS: Record<string, { x: number; y: number; anchor: 'start' | 'end' }> = {
  'us-west-2': { x: 12, y: -13, anchor: 'start' },
  'us-east-1': { x: 12, y: -13, anchor: 'start' },
  'sa-east-1': { x: 12, y: -12, anchor: 'start' },
  'eu-west-1': { x: -12, y: -18, anchor: 'end' },
  'eu-central-1': { x: 13, y: -17, anchor: 'start' },
  'ap-south-1': { x: 11, y: -12, anchor: 'start' },
  'ap-southeast-1': { x: 12, y: 18, anchor: 'start' },
  'ap-northeast-1': { x: -12, y: -12, anchor: 'end' }
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
  degraded: 'Degradado',
  down: 'Mantenimiento'
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface RegionMapProps {
  regions: Region[]
  servers?: CloudServer[]
}

interface FloatView {
  center: [number, number]
  zoom: number
}

function distanceKm(first: [number, number], second: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const [firstLongitude, firstLatitude] = first
  const [secondLongitude, secondLatitude] = second
  const latitudeDelta = radians(secondLatitude - firstLatitude)
  const longitudeDelta = radians(secondLongitude - firstLongitude)
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(firstLatitude)) *
      Math.cos(radians(secondLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount)
}

export default function RegionMap({ regions, servers = [] }: RegionMapProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [view, setView] = useState<FloatView>({ center: WORLD_CENTER, zoom: WORLD_ZOOM })
  const [selected, setSelected] = useState<Region | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const { state: localLocation, detectLocation, clearLocation } = useLocalLocation()

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
  const landFill = isDark ? '#386b8c' : '#b9cde3'
  const landHoverFill = isDark ? '#4d83a4' : '#9db9d6'
  const landStroke = isDark ? '#183b5b' : '#ffffff'
  const labelFill = isDark ? '#f8fafc' : '#0f172a'
  const labelSubFill = isDark ? '#9bb2c9' : '#475569'
  const labelHalo = isDark ? '#0b1d38' : '#ffffff'
  const statusColor = (status: RegionStatus) => (isDark ? STATUS_DARK : STATUS_LIGHT)[status]
  const monthlyCosts = useMemo(
    () =>
      Object.fromEntries(
        regions.map((region) => [
          region.id,
          deriveMetrics(servers.filter((server) => server.regionId === region.id)).totalMonthly
        ])
      ),
    [regions, servers]
  )
  const nearestRegion = useMemo(() => {
    if (localLocation.status !== 'ready') return null
    const origin: [number, number] = [localLocation.location.longitude, localLocation.location.latitude]
    return Object.entries(REGION_COORDS)
      .map(([id, coordinates]) => ({ id, distance: distanceKm(origin, coordinates) }))
      .sort((first, second) => first.distance - second.distance)[0]
  }, [localLocation])
  const localLatency = nearestRegion ? Math.round(35 + nearestRegion.distance / 72) : null

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
    <>
    <section className="overflow-hidden rounded-xl border border-border bg-surface text-textPrimary shadow-card dark:border-slate-600 dark:bg-[#0b1d38] dark:text-slate-100 dark:shadow-[0_20px_55px_rgba(2,12,30,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-white">
            <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            Mapa Global de Infraestructura
          </h2>
          <p className="mt-1 text-sm text-textSecondary dark:text-slate-300">
            Ubicación física de {regions.length} regiones AWS activas y enlaces de backbone simulados hacia el hub primario (US East, N. Virginia).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {localLocation.status === 'ready' && (
            <button
              type="button"
              onClick={clearLocation}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-textPrimary hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            >
              Quitar nodo local
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-textPrimary transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          >
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </button>
          <button
            type="button"
            onClick={detectLocation}
            disabled={localLocation.status === 'detecting'}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-wait disabled:opacity-60"
          >
            <Crosshair className="h-4 w-4" />
            {localLocation.status === 'detecting' ? 'Detectando…' : 'Detectar mi ubicación'}
          </button>
        </div>
      </div>

      <div className="relative mt-4 h-64 border-y border-border bg-[radial-gradient(ellipse_at_50%_42%,#f4f8fd_0%,#dce8f6_72%)] dark:border-slate-700 dark:bg-[radial-gradient(ellipse_at_50%_42%,#102b50_0%,#091b38_72%)] sm:h-80 md:h-[23rem] lg:h-[26rem] xl:h-[27rem]">
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

            {regions
              .filter((region) => region.id !== 'us-east-1' && REGION_COORDS[region.id])
              .map((region) => (
                <Line
                  key={`backbone-${region.id}`}
                  from={REGION_COORDS[region.id]}
                  to={REGION_COORDS['us-east-1']}
                  stroke={region.status === 'down' ? (isDark ? '#fb7185' : '#e11d48') : isDark ? '#55c9ef' : '#0891b2'}
                  strokeWidth={1.2}
                  strokeDasharray="5 5"
                  opacity={0.72}
                />
              ))}

            {regions.map((region) => {
              const coords = REGION_COORDS[region.id]
              if (!coords) return null
              const color = statusColor(region.status)
              const isActive = selected?.id === region.id
              const radius = 7 + (region.serversDeployed / maxServers) * 8
              const iconSize = Math.round(radius * 1.1)
              const label = REGION_LABELS[region.id]
              const labelX = label?.x ?? 12
              const labelY = label?.y ?? -12
              const labelAnchor = label?.anchor ?? 'start'

              return (
                <Marker key={region.id} coordinates={coords} onClick={() => handleSelect(region)}>
                  <g className="cursor-pointer" aria-label={`${region.name}, ${region.latencyMs} milisegundos`}>
                    <circle r={radius + 5} fill={color} opacity={isActive ? 0.25 : 0.12} />
                    <circle r={radius + 8} fill={color} opacity={0.3} className="animate-ping" />
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
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={labelAnchor}
                      fill={labelFill}
                      fontSize="10"
                      fontWeight="700"
                      style={{ paintOrder: 'stroke', stroke: labelHalo, strokeWidth: 3, strokeLinejoin: 'round' }}
                    >
                      {region.name}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 12}
                      textAnchor={labelAnchor}
                      fill={labelSubFill}
                      fontSize="8"
                      style={{ paintOrder: 'stroke', stroke: labelHalo, strokeWidth: 2.5, strokeLinejoin: 'round' }}
                    >
                      {region.id} · {region.latencyMs} ms
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 22}
                      textAnchor={labelAnchor}
                      fill={labelSubFill}
                      fontSize="8"
                      style={{ paintOrder: 'stroke', stroke: labelHalo, strokeWidth: 2.5, strokeLinejoin: 'round' }}
                    >
                      {region.deployedServices.length} servicios · {region.availabilityZones.length} AZ
                    </text>
                  </g>
                </Marker>
              )
            })}

            {localLocation.status === 'ready' && (
              <Marker coordinates={[localLocation.location.longitude, localLocation.location.latitude]}>
                <g aria-label={`Nodo local ${localLocation.location.district ?? 'detectado'}`}>
                  <circle r={19} fill="#F97316" opacity={0.25} className="animate-ping" />
                  <circle r={11} fill="#F97316" stroke="#FFFFFF" strokeWidth={2} />
                  <MapPin size={15} strokeWidth={2.5} className="pointer-events-none text-white" style={{ transform: 'translate(-7.5px, -12px)' }} />
                </g>
              </Marker>
            )}
          </ZoomableGroup>
        </ComposableMap>

        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden flex-wrap items-center gap-3 rounded-full border border-border bg-white/90 px-3.5 py-2 text-xs font-medium text-textPrimary shadow-sm dark:border-slate-600 dark:bg-[#0b1d38]/90 dark:text-slate-200 backdrop-blur sm:flex">
          {(['operational', 'degraded', 'down'] as RegionStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColor(status) }}
              />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:bottom-4 sm:left-4 sm:right-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-3.5 py-1.5 text-xs font-medium text-textPrimary shadow-sm dark:border-slate-600 dark:bg-[#0b1d38]/90 dark:text-slate-200 backdrop-blur">
            <Globe className="h-3.5 w-3.5" />
            Pulsa una región para ver el detalle técnico
          </span>
        </div>
      </div>
      {localLocation.status === 'error' && (
        <p role="alert" className="border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
          {localLocation.message} Comprueba el permiso de ubicación y usa HTTPS o localhost.
        </p>
      )}
      <div className="border-t border-border bg-surface px-5 py-4 dark:border-slate-700 dark:bg-[#0b1d38] sm:px-6">
        {localLocation.status === 'ready' ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-textPrimary dark:text-white">
                <MapPin className="h-4 w-4 shrink-0 text-orange-500 dark:text-orange-400" />
                Nodo Local: {localLocation.location.district ?? localLocation.location.city ?? 'Ubicación detectada'}
                {localLocation.location.city && localLocation.location.city !== localLocation.location.district ? `, ${localLocation.location.city}` : ''}
              </p>
              <p className="mt-1 text-xs text-textSecondary dark:text-slate-300">
                {localLocation.location.address ?? `${localLocation.location.latitude.toFixed(4)}, ${localLocation.location.longitude.toFixed(4)}`}
                {localLocation.location.country && ` · ${localLocation.location.country}`}
              </p>
            </div>
            {nearestRegion && (
              <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 dark:border-orange-400/50 dark:bg-orange-950/40">
                <p className="text-[11px] font-semibold uppercase text-orange-700 dark:text-orange-200">Región AWS más cercana · RTT simulado</p>
                <p className="mt-0.5 text-sm font-bold text-orange-900 dark:text-orange-100">
                  {regions.find((region) => region.id === nearestRegion.id)?.name ?? nearestRegion.id} · {localLatency} ms
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-textSecondary dark:text-slate-300">
            El nodo local es opcional; al detectar tu ubicación, el navegador solicitará permiso GPS y el mapa calculará el RTT simulado a la región AWS más cercana.
          </p>
        )}
      </div>
    </section>
    {selected && (
      <RegionDetailModal
        region={selected}
        monthlyCost={monthlyCosts[selected.id] ?? 0}
        onClose={() => setSelected(null)}
      />
    )}
    </>
  )
}