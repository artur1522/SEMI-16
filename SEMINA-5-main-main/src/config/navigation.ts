import {
  Activity,
  Boxes,
  ClipboardList,
  DollarSign,
  Globe,
  Home,
  Network,
  Server,
  Settings,
  Shield,
  type LucideIcon
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  /** Título corto mostrado en la barra superior. */
  shortTitle: string
  /** Título completo mostrado en el encabezado de la página. */
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  group: 'operaciones' | 'gobierno'
}

/**
 * Navegación compartida: Sidebar, barra superior, encabezados de página y
 * tarjetas de módulos del Dashboard leen de esta única lista.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    shortTitle: 'Dashboard',
    title: 'Dashboard',
    eyebrow: 'Resumen ejecutivo',
    description: 'Estado global de proyectos, costos, infraestructura y seguridad.',
    icon: Home,
    group: 'operaciones'
  },
  {
    path: '/planning',
    label: 'Planificación',
    shortTitle: 'Planificación Cloud',
    title: 'Planificación Cloud',
    eyebrow: 'Propuestas',
    description: 'Define y evalúa propuestas de arquitectura cloud antes de desplegarlas.',
    icon: ClipboardList,
    group: 'operaciones'
  },
  {
    path: '/costs',
    label: 'Costos',
    shortTitle: 'Costos',
    title: 'Costos y presupuesto',
    eyebrow: 'Finanzas',
    description: 'Consumo real por proyecto, presupuestos y proyección a 12 meses.',
    icon: DollarSign,
    group: 'operaciones'
  },
  {
    path: '/infrastructure',
    label: 'Infraestructura',
    shortTitle: 'Infraestructura',
    title: 'Infraestructura global',
    eyebrow: 'Capa física',
    description: 'Regiones, disponibilidad, inventario de recursos y replicación.',
    icon: Globe,
    group: 'operaciones'
  },
  {
    path: '/security',
    label: 'Seguridad',
    shortTitle: 'Seguridad',
    title: 'Centro de seguridad',
    eyebrow: 'Cumplimiento',
    description: 'Puntuación, hardening, auditoría IAM y responsabilidad compartida.',
    icon: Shield,
    group: 'gobierno'
  },
  {
    path: '/network',
    label: 'Red',
    shortTitle: 'Arquitectura de Red',
    title: 'Arquitectura de red',
    eyebrow: 'Conectividad',
    description: 'Flujo de tráfico, VPCs, CDN, dominios y grupos de seguridad.',
    icon: Network,
    group: 'gobierno'
  },
  {
    path: '/services',
    label: 'Servicios',
    shortTitle: 'Servicios',
    title: 'Catálogo de servicios',
    eyebrow: 'Plataforma',
    description: 'Catálogo agrupado por categoría con uso real en el portafolio.',
    icon: Server,
    group: 'gobierno'
  },
  {
    path: '/config',
    label: 'Configuración',
    shortTitle: 'Configuración',
    title: 'Configuración',
    eyebrow: 'Preferencias',
    description: 'Moneda, densidad, alertas y estado del sistema.',
    icon: Settings,
    group: 'gobierno'
  }
]

export const NAV_GROUPS: { key: NavItem['group']; label: string }[] = [
  { key: 'operaciones', label: 'Operación' },
  { key: 'gobierno', label: 'Gobierno y plataforma' }
]

export const NAV_TITLES: Record<string, string> = NAV_ITEMS.reduce(
  (acc, item) => ({ ...acc, [item.path]: item.shortTitle }),
  {} as Record<string, string>
)

export function navItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.path === pathname)
}

/** Métricas auxiliares para las tarjetas de módulos del Dashboard. */
export const MODULE_META: Record<
  string,
  { icon: LucideIcon; detail: string }
> = {
  '/planning': { icon: ClipboardList, detail: 'propuestas registradas' },
  '/costs': { icon: DollarSign, detail: 'del presupuesto' },
  '/infrastructure': { icon: Globe, detail: 'regiones operativas' },
  '/security': { icon: Shield, detail: 'score de seguridad' },
  '/network': { icon: Network, detail: 'salud de red' },
  '/services': { icon: Boxes, detail: 'servicios en uso' },
  '/config': { icon: Settings, detail: 'preferencias' },
  '/dashboard': { icon: Activity, detail: 'indicadores' }
}
