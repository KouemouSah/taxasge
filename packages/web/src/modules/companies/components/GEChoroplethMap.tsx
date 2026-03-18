'use client'

/**
 * GE Choropleth Map — Leaflet + GeoJSON
 *
 * Displays the 12 commerce zones of Equatorial Guinea on an interactive map.
 * Color-coded by a metric (companies count, debt, recovery rate).
 * Tooltip on hover, click to select zone.
 *
 * Uses dynamic import (next/dynamic) because Leaflet requires window/document.
 */

import { useEffect, useRef, useState } from 'react'
import type { ZoneStats } from '../types'

// Leaflet CSS must be imported for the map to render correctly
import 'leaflet/dist/leaflet.css'

import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature, Geometry } from 'geojson'

export type MapMetric = 'companies' | 'debt' | 'recovery'

interface Props {
  zones: ZoneStats[]
  metric?: MapMetric
  height?: string
  onZoneClick?: (zoneCode: string) => void
}

// Color scales
function getColor(value: number, max: number, metric: MapMetric): string {
  if (max === 0) return '#e5e7eb'
  const ratio = Math.min(value / max, 1)

  if (metric === 'recovery') {
    // Green = high recovery, Red = low
    if (ratio >= 0.8) return '#22c55e'
    if (ratio >= 0.6) return '#84cc16'
    if (ratio >= 0.4) return '#eab308'
    if (ratio >= 0.2) return '#f97316'
    return '#ef4444'
  }

  // For companies/debt: lighter = less, darker = more
  const colors = ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7', '#0c4a6e']
  const idx = Math.min(Math.floor(ratio * colors.length), colors.length - 1)
  return colors[idx]
}

function getMetricValue(zone: ZoneStats, metric: MapMetric): number {
  switch (metric) {
    case 'companies': return zone.total_companies
    case 'debt': return zone.total_debt
    case 'recovery': return zone.recovery_rate_pct
  }
}

function formatValue(value: number, metric: MapMetric): string {
  if (metric === 'recovery') return `${value}%`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M XAF`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export default function GEChoroplethMap({ zones, metric = 'companies', height = '400px', onZoneClick }: Props) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null)
  const geoRef = useRef<L.GeoJSON>(null)

  // Precompute zone lookup
  const zoneMap = new Map(zones.map(z => [z.zone_code, z]))
  const maxValue = Math.max(...zones.map(z => getMetricValue(z, metric)), 1)

  // Load GeoJSON
  useEffect(() => {
    fetch('/geo/ge-zones.geojson')
      .then(r => r.json())
      .then(setGeoData)
      .catch(() => {})
  }, [])

  // Style each feature based on zone data
  const style = (feature: Feature<Geometry> | undefined): PathOptions => {
    const code = feature?.properties?.zone_code
    const zone = code ? zoneMap.get(code) : undefined
    const value = zone ? getMetricValue(zone, metric) : 0

    return {
      fillColor: getColor(value, maxValue, metric),
      weight: 2,
      opacity: 1,
      color: '#374151',
      fillOpacity: 0.75,
    }
  }

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const code = feature.properties?.zone_code
    const zone = code ? zoneMap.get(code) : undefined

    if (zone) {
      const content = `
        <strong>${zone.zone_code} — ${zone.zone_name}</strong><br/>
        Empresas: ${zone.total_companies}<br/>
        Cobro: ${zone.recovery_rate_pct}%<br/>
        Deuda: ${formatValue(zone.total_debt, 'debt')}
      `
      layer.bindTooltip(content, { sticky: true })
    }

    layer.on({
      mouseover: (e) => {
        const l = e.target
        l.setStyle({ weight: 3, fillOpacity: 0.9 })
        l.bringToFront()
      },
      mouseout: () => {
        geoRef.current?.resetStyle()
      },
      click: () => {
        if (onZoneClick && code) onZoneClick(code)
      },
    })
  }

  if (!geoData) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-muted/30 rounded">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded overflow-hidden border">
      <MapContainer
        center={[1.8, 10.0]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          ref={geoRef}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  )
}
