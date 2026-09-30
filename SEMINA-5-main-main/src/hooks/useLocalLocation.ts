import { useCallback, useState } from 'react'

export interface LocalLocation {
  longitude: number
  latitude: number
  district?: string
  address?: string
  city?: string
  region?: string
  country?: string
}

type LocalLocationState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'ready'; location: LocalLocation }
  | { status: 'error'; message: string }

interface ReverseGeocodeResult {
  address?: Record<string, string | undefined>
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este navegador no ofrece geolocalización.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const message =
          error.code === 1
            ? 'Permiso de ubicación denegado.'
            : error.code === 3
              ? 'La ubicación tardó demasiado en responder.'
              : 'No se pudo obtener la ubicación GPS.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  })
}

function parseAddress(address: Record<string, string | undefined> = {}) {
  const district =
    address.city_district ??
    address.district ??
    address.suburb ??
    address.neighbourhood ??
    address.quarter ??
    address.borough ??
    address.county
  const city = address.city ?? address.town ?? address.village ?? address.municipality
  const street = [address.road, address.house_number].filter(Boolean).join(' ')
  const formatted = [street, district, city, address.state, address.country]
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(', ')

  return {
    district: district ?? city,
    address: formatted || undefined,
    city,
    region: address.state ?? address.region,
    country: address.country
  }
}

export function useLocalLocation() {
  const [state, setState] = useState<LocalLocationState>({ status: 'idle' })

  const detectLocation = useCallback(async () => {
    setState({ status: 'detecting' })
    try {
      const position = await getCurrentPosition()
      const location: LocalLocation = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude
      }

      try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse')
        url.searchParams.set('format', 'jsonv2')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('zoom', '18')
        url.searchParams.set('accept-language', 'es')
        url.searchParams.set('lat', String(location.latitude))
        url.searchParams.set('lon', String(location.longitude))
        const response = await fetch(url, { headers: { 'Accept-Language': 'es' } })
        if (response.ok) {
          const result = (await response.json()) as ReverseGeocodeResult
          Object.assign(location, parseAddress(result.address))
        }
      } catch {
        // Coordinates remain useful if reverse geocoding is unavailable.
      }

      setState({ status: 'ready', location })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'No se pudo obtener la ubicación GPS.'
      })
    }
  }, [])

  const clearLocation = useCallback(() => setState({ status: 'idle' }), [])

  return { state, detectLocation, clearLocation }
}