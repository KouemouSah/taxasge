'use client'

/**
 * Professional SVG Map of Equatorial Guinea — 8 provinces
 *
 * Geographically accurate simplified outlines.
 * Bioko island (Gulf of Guinea) + Río Muni (continental) + Annobón inset.
 * Color-coded by metric, tooltip on hover, click to filter.
 *
 * Provinces:
 *   INSULAR: Bioko Norte (Malabo), Bioko Sur (Luba), Annobón (San Antonio de Palé)
 *   CONTINENTAL: Kie-Ntem (Ebebiyín), Wele-Nzas (Mongomo), Djibloho (Oyala),
 *                Centro-Sur (Evinayong), Litoral (Bata)
 */

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'

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

// ═══════════════════════════════════════════════════════════════
// PROVINCE DEFINITIONS — simplified but geographically accurate
// viewBox: 0 0 700 480
// Bioko (left, island), Continental (right, mainland), Annobón (inset bottom-left)
// ═══════════════════════════════════════════════════════════════

const PROVINCES: Record<string, {
  path: string
  labelX: number; labelY: number
  capital?: string; capitalX?: number; capitalY?: number
  region: 'Insular' | 'Continental'
}> = {
  // ── BIOKO ISLAND (Gulf of Guinea) ──
  'BIOKO-NORTE': {
    // Northern 60% of Bioko — includes Malabo
    path: 'M95,105 C100,92 115,82 135,78 L160,80 C175,85 185,95 188,110 L186,135 C183,145 175,152 165,155 L130,158 C115,155 102,148 96,138 Z',
    labelX: 140, labelY: 118,
    capital: 'Malabo', capitalX: 150, capitalY: 100,
    region: 'Insular',
  },
  'BIOKO-SUR': {
    // Southern 40% of Bioko — includes Luba
    path: 'M96,138 C102,148 115,155 130,158 L165,155 C175,152 183,145 186,135 L190,160 C188,178 180,195 170,205 L155,215 C140,220 125,218 115,210 L105,195 C97,180 93,165 94,150 Z',
    labelX: 142, labelY: 180,
    capital: 'Luba', capitalX: 140, capitalY: 195,
    region: 'Insular',
  },

  // ── CONTINENTAL REGION (Río Muni) ──
  'KIE-NTEM': {
    // Northernmost — borders Cameroon
    path: 'M310,72 L430,68 C445,70 458,78 465,90 L468,115 L440,130 L395,140 L345,135 L310,118 Z',
    labelX: 390, labelY: 100,
    capital: 'Ebebiyín', capitalX: 420, capitalY: 88,
    region: 'Continental',
  },
  'WELE-NZAS': {
    // Center-north, east of Kie-Ntem
    path: 'M345,135 L395,140 L440,130 L468,115 L475,150 L478,190 L450,210 L400,218 L360,205 L338,175 Z',
    labelX: 410, labelY: 170,
    capital: 'Mongomo', capitalX: 450, capitalY: 155,
    region: 'Continental',
  },
  'DJIBLOHO': {
    // Center — new capital district (Oyala / Ciudad de la Paz)
    path: 'M338,175 L360,205 L400,218 L405,248 L380,265 L350,260 L325,240 L320,210 Z',
    labelX: 360, labelY: 225,
    capital: 'Oyala', capitalX: 370, capitalY: 240,
    region: 'Continental',
  },
  'CENTRO-SUR': {
    // Center-south — large interior province
    path: 'M325,240 L350,260 L380,265 L405,248 L450,210 L478,190 L485,230 L480,280 L460,310 L420,330 L375,335 L340,315 L315,285 Z',
    labelX: 410, labelY: 280,
    capital: 'Evinayong', capitalX: 430, capitalY: 265,
    region: 'Continental',
  },
  'LITORAL': {
    // Southwest coast — includes Bata (largest city)
    path: 'M310,118 L345,135 L338,175 L320,210 L325,240 L315,285 L340,315 L375,335 L380,360 L350,380 L310,385 L285,365 L270,330 L268,290 L275,240 L280,190 L290,150 Z',
    labelX: 310, labelY: 260,
    capital: 'Bata', capitalX: 290, capitalY: 305,
    region: 'Continental',
  },

  // ── ANNOBÓN (inset — island 350km SW of Bioko) ──
  'ANNOBON': {
    // Tiny volcanic island — shown in inset box
    path: 'M82,398 C86,392 95,390 102,393 L108,400 C110,407 107,415 100,418 L90,420 C84,418 80,412 80,405 Z',
    labelX: 95, labelY: 408,
    capital: 'S.A. de Palé', capitalX: 95, capitalY: 420,
    region: 'Insular',
  },
}

// ═══════════════════════════════════════════════════════════════
// COLOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getColor(value: number, max: number, colorBy: string): string {
  if (max === 0) return '#e2e8f0'
  const pct = Math.min(value / max, 1)

  if (colorBy === 'recovery') {
    // Diverging: red → yellow → green
    if (pct >= 0.7) return `hsl(${120}, ${55 + pct * 20}%, ${42}%)`
    if (pct >= 0.4) return `hsl(${45}, ${70}%, ${50}%)`
    if (pct > 0) return `hsl(${0}, ${55 + pct * 30}%, ${48}%)`
    return '#e2e8f0'
  }
  if (colorBy === 'debt') {
    // Sequential red: light → dark
    const l = 92 - pct * 50
    return `hsl(0, ${50 + pct * 30}%, ${l}%)`
  }
  // companies: sequential blue
  const l = 92 - pct * 48
  return `hsl(217, ${50 + pct * 30}%, ${l}%)`
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// Legend stops
const LEGEND_STOPS: Record<string, { label: string; colors: string[] }> = {
  companies: { label: 'Empresas', colors: ['#dbeafe', '#3b82f6', '#1e3a8a'] },
  debt: { label: 'Deuda (XAF)', colors: ['#fee2e2', '#ef4444', '#7f1d1d'] },
  recovery: { label: 'Recovery %', colors: ['#ef4444', '#eab308', '#22c55e'] },
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

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
    return 100
  }, [data, colorBy])

  const hoveredData = hovered ? dataMap.get(hovered) : null
  const legend = LEGEND_STOPS[colorBy]

  return (
    <div className="relative">
      <svg viewBox="0 0 700 480" className="w-full h-auto" role="img" aria-label="Mapa de Guinea Ecuatorial por provincias">
        <defs>
          {/* Ocean pattern */}
          <pattern id="ocean" patternUnits="userSpaceOnUse" width="12" height="12">
            <line x1="0" y1="6" x2="12" y2="6" stroke="#bfdbfe" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          {/* Legend gradient */}
          <linearGradient id={`legend-${colorBy}`} x1="0" x2="1" y1="0" y2="0">
            {legend.colors.map((c, i) => (
              <stop key={i} offset={`${(i / (legend.colors.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </linearGradient>
        </defs>

        {/* Background — ocean */}
        <rect width="700" height="480" fill="#f0f7ff" rx="6" />
        <rect width="700" height="480" fill="url(#ocean)" rx="6" />

        {/* ── Neighboring countries (context) ── */}
        <path d="M300,30 L500,25 L530,50 L540,70 L468,90 L465,68 L430,68 L310,72 L290,50 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="420" y="50" textAnchor="middle" className="fill-gray-300" fontSize="9" fontStyle="italic">Camerún</text>

        <path d="M485,230 L510,210 L540,250 L535,330 L510,380 L480,400 L420,400 L380,360 L375,335 L420,330 L460,310 L480,280 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="510" y="320" textAnchor="middle" className="fill-gray-300" fontSize="9" fontStyle="italic">Gabón</text>

        {/* Gabon south border */}
        <path d="M310,385 L350,380 L380,360 L420,400 L350,410 L290,400 L270,390 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* ── Region labels ── */}
        <text x="140" y="68" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="2" className="fill-gray-400 uppercase">Bioko</text>
        <text x="385" y="55" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="2" className="fill-gray-400 uppercase">Río Muni</text>

        {/* ── Gulf of Guinea label ── */}
        <text x="215" y="300" textAnchor="middle" fontSize="8" fontStyle="italic" className="fill-blue-300" transform="rotate(-15 215 300)">Golfo de Guinea</text>

        {/* ── Provinces ── */}
        {Object.entries(PROVINCES).map(([key, prov]) => {
          const d = dataMap.get(key)
          const val = colorBy === 'companies' ? (d?.companies ?? 0) :
                      colorBy === 'debt' ? (d?.debt ?? 0) :
                      (d?.recovery ?? 0)
          const fill = getColor(val, maxVal, colorBy)
          const isSelected = selected === key
          const isHov = hovered === key
          const dimmed = selected != null && !isSelected

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
                stroke={isSelected ? '#1e40af' : isHov ? '#3b82f6' : '#94a3b8'}
                strokeWidth={isSelected ? 2.5 : isHov ? 1.8 : 1}
                opacity={dimmed ? 0.35 : 1}
                className="transition-all duration-200"
              />
              {/* Province label */}
              <text x={prov.labelX} y={prov.labelY - 8} textAnchor="middle" fontSize="7" fontWeight="600"
                className="fill-gray-700 pointer-events-none select-none" opacity={dimmed ? 0.3 : 1}>
                {key.length > 10 ? key.replace('-', '-\n').split('\n').map((l, i) => (
                  <tspan key={i} x={prov.labelX} dy={i === 0 ? 0 : 9}>{l}</tspan>
                )) : key}
              </text>
              {/* Inline metric counter (always visible) */}
              {d && !dimmed && (
                <text x={prov.labelX} y={prov.labelY + (key.length > 10 ? 14 : 5)} textAnchor="middle"
                  fontSize="9" fontWeight="700" className="pointer-events-none select-none"
                  fill={colorBy === 'debt' ? '#991b1b' : colorBy === 'recovery' ? '#166534' : '#1e3a8a'}>
                  {colorBy === 'companies' ? d.companies :
                   colorBy === 'debt' ? fmtK(d.debt) :
                   `${d.recovery}%`}
                </text>
              )}
              {/* Capital marker */}
              {prov.capital && prov.capitalX && prov.capitalY && !dimmed && (
                <>
                  <circle cx={prov.capitalX} cy={prov.capitalY} r="2" fill="#1e293b" opacity={0.7} className="pointer-events-none" />
                  <text x={prov.capitalX + 5} y={prov.capitalY + 3} fontSize="5.5" className="fill-gray-500 pointer-events-none" fontStyle="italic">
                    {prov.capital}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* ── Annobón inset box ── */}
        <rect x="55" y="370" width="80" height="70" rx="3" fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2" />
        <text x="95" y="383" textAnchor="middle" fontSize="6" className="fill-gray-400">Annobón (encart)</text>

        {/* ── North arrow ── */}
        <g transform="translate(640, 60)">
          <line x1="0" y1="20" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrowN)" />
          <polygon points="0,0 -4,8 4,8" fill="#64748b" />
          <text x="0" y="30" textAnchor="middle" fontSize="8" fontWeight="700" className="fill-gray-500">N</text>
        </g>

        {/* ── Legend ── */}
        <g transform="translate(520, 430)">
          <text x="0" y="0" fontSize="7.5" fontWeight="600" className="fill-gray-500">{legend.label}</text>
          <rect x="0" y="5" width="120" height="8" rx="2" fill={`url(#legend-${colorBy})`} />
          <text x="0" y="22" fontSize="6" className="fill-gray-400">
            {colorBy === 'recovery' ? '0%' : '0'}
          </text>
          <text x="120" y="22" textAnchor="end" fontSize="6" className="fill-gray-400">
            {colorBy === 'recovery' ? '100%' : colorBy === 'debt' ? fmtK(maxVal) + ' XAF' : String(maxVal)}
          </text>
        </g>

        {/* ── Scale reference ── */}
        <g transform="translate(520, 460)">
          <line x1="0" y1="0" x2="60" y2="0" stroke="#94a3b8" strokeWidth="1" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1" />
          <line x1="60" y1="-3" x2="60" y2="3" stroke="#94a3b8" strokeWidth="1" />
          <text x="30" y="10" textAnchor="middle" fontSize="6" className="fill-gray-400">≈ 100 km</text>
        </g>
      </svg>

      {/* ── Tooltip ── */}
      {hoveredData && (
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm border shadow-lg rounded-lg p-3 text-xs pointer-events-none z-10 min-w-[160px]">
          <p className="font-semibold text-sm mb-1.5">{hoveredData.provincia}</p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Empresas:</span>
              <strong className="text-foreground">{hoveredData.companies}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Deuda:</span>
              <strong className="text-red-600">{fmtK(hoveredData.debt)} XAF</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Recovery:</span>
              <Badge className={`text-[9px] px-1.5 py-0 ${
                hoveredData.recovery >= 70 ? 'bg-green-100 text-green-800' :
                hoveredData.recovery >= 40 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{hoveredData.recovery}%</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
