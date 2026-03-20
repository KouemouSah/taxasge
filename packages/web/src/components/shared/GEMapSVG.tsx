'use client'

/**
 * SVG Map of Equatorial Guinea — 8 provinces
 *
 * Pure SVG component (no Leaflet). Simplified province outlines.
 * Color-coded by metric (companies, debt, recovery).
 * Tooltip on hover, click to select/filter.
 *
 * Geographic layout:
 *   INSULAR (left):  Bioko Norte, Bioko Sur (island), Annobon (small island below)
 *   CONTINENTAL (right): Kie-Ntem (north), Wele-Nzas (center-north),
 *                         Centro-Sur (center), Djibloho (center-east),
 *                         Litoral (south/coast)
 */

import { useMemo, useState } from 'react'

export interface ProvinceData {
  provincia: string
  companies: number
  debt: number
  recovery: number
}

interface GEMapProps {
  data: ProvinceData[]
  colorBy: 'companies' | 'debt' | 'recovery'
  selected?: string | null
  onSelect?: (provincia: string | null) => void
}

// Province SVG paths (simplified outlines positioned in viewBox 0 0 600 400)
const PROVINCES: Record<string, { path: string; labelX: number; labelY: number; region: 'Insular' | 'Continental' }> = {
  'BIOKO-NORTE': {
    path: 'M80,80 L140,70 L160,100 L155,150 L120,160 L80,145 Z',
    labelX: 115, labelY: 115, region: 'Insular',
  },
  'BIOKO-SUR': {
    path: 'M80,145 L120,160 L155,150 L160,190 L130,220 L85,200 Z',
    labelX: 118, labelY: 180, region: 'Insular',
  },
  'ANNOBON': {
    path: 'M60,310 L90,305 L95,330 L75,340 Z',
    labelX: 77, labelY: 322, region: 'Insular',
  },
  'KIE-NTEM': {
    path: 'M280,40 L420,35 L440,70 L450,130 L380,140 L300,120 L270,80 Z',
    labelX: 360, labelY: 85, region: 'Continental',
  },
  'WELE-NZAS': {
    path: 'M270,80 L300,120 L380,140 L390,200 L320,220 L250,190 L240,130 Z',
    labelX: 310, labelY: 160, region: 'Continental',
  },
  'DJIBLOHO': {
    path: 'M380,140 L450,130 L470,180 L460,240 L390,250 L390,200 Z',
    labelX: 425, labelY: 190, region: 'Continental',
  },
  'CENTRO-SUR': {
    path: 'M250,190 L320,220 L390,200 L390,250 L460,240 L470,290 L400,320 L310,310 L240,270 Z',
    labelX: 350, labelY: 270, region: 'Continental',
  },
  'LITORAL': {
    path: 'M240,270 L310,310 L400,320 L420,370 L340,380 L260,360 L230,320 Z',
    labelX: 325, labelY: 350, region: 'Continental',
  },
}

function getColor(value: number, max: number, colorBy: string): string {
  if (max === 0) return '#e5e7eb'
  const pct = Math.min(value / max, 1)

  if (colorBy === 'recovery') {
    // Green = high recovery (good), Red = low recovery (bad)
    if (pct >= 0.7) return '#22c55e'
    if (pct >= 0.4) return '#eab308'
    return '#ef4444'
  }
  if (colorBy === 'debt') {
    // Red gradient = high debt (bad)
    const r = Math.round(239 * pct + 229 * (1 - pct))
    const g = Math.round(68 * pct + 231 * (1 - pct))
    const b = Math.round(68 * pct + 235 * (1 - pct))
    return `rgb(${r},${g},${b})`
  }
  // companies: blue gradient
  const r = Math.round(59 * pct + 219 * (1 - pct))
  const g = Math.round(130 * pct + 234 * (1 - pct))
  const b = Math.round(246 * pct + 254 * (1 - pct))
  return `rgb(${r},${g},${b})`
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function GEMapSVG({ data, colorBy, selected, onSelect }: GEMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const dataMap = useMemo(() => {
    const m = new Map<string, ProvinceData>()
    for (const d of data) m.set(d.provincia, d)
    return m
  }, [data])

  const maxVal = useMemo(() => {
    if (colorBy === 'companies') return Math.max(...data.map(d => d.companies), 1)
    if (colorBy === 'debt') return Math.max(...data.map(d => d.debt), 1)
    return 100 // recovery is 0-100
  }, [data, colorBy])

  const hoveredData = hovered ? dataMap.get(hovered) : null

  return (
    <div className="relative">
      <svg viewBox="0 0 550 400" className="w-full h-auto" role="img" aria-label="Mapa de Guinea Ecuatorial">
        {/* Sea background */}
        <rect width="550" height="400" fill="#f0f9ff" rx="8" />

        {/* Region labels */}
        <text x="110" y="55" textAnchor="middle" className="fill-gray-400" fontSize="10" fontWeight="500">INSULAR</text>
        <text x="360" y="25" textAnchor="middle" className="fill-gray-400" fontSize="10" fontWeight="500">CONTINENTAL</text>

        {/* Provinces */}
        {Object.entries(PROVINCES).map(([key, prov]) => {
          const d = dataMap.get(key)
          const val = colorBy === 'companies' ? (d?.companies ?? 0) :
                      colorBy === 'debt' ? (d?.debt ?? 0) :
                      (d?.recovery ?? 0)
          const fill = getColor(val, maxVal, colorBy)
          const isSelected = selected === key
          const isHovered = hovered === key

          return (
            <g key={key}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(isSelected ? null : key)}
              className="cursor-pointer"
            >
              <path
                d={prov.path}
                fill={fill}
                stroke={isSelected ? '#1d4ed8' : isHovered ? '#3b82f6' : '#fff'}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                className="transition-all duration-200"
                opacity={selected && !isSelected ? 0.4 : 1}
              />
              <text
                x={prov.labelX} y={prov.labelY}
                textAnchor="middle" fontSize="8" fontWeight="600"
                className="fill-gray-800 pointer-events-none select-none"
              >
                {key.replace('-', '\n').split('\n').map((line, i) => (
                  <tspan key={i} x={prov.labelX} dy={i === 0 ? 0 : 10}>{line}</tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredData && (
        <div className="absolute top-2 right-2 bg-white border shadow-lg rounded-lg p-2.5 text-xs pointer-events-none z-10 min-w-[140px]">
          <p className="font-semibold text-sm mb-1">{hoveredData.provincia}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <div className="flex justify-between"><span>Empresas:</span><strong className="text-foreground">{hoveredData.companies}</strong></div>
            <div className="flex justify-between"><span>Deuda:</span><strong className="text-red-600">{fmtK(hoveredData.debt)} XAF</strong></div>
            <div className="flex justify-between"><span>Recovery:</span><strong className={hoveredData.recovery >= 60 ? 'text-green-600' : 'text-red-600'}>{hoveredData.recovery}%</strong></div>
          </div>
        </div>
      )}
    </div>
  )
}
