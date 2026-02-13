'use client'

import { useParams } from 'next/navigation'
import { AgentBatchList } from '@/modules/agent-dashboard/components/batch'

const ENTITY_CODE_MAP: Record<string, string> = {
  'dgt': 'DGT',
  'ofive': 'OFIVE',
  'onrc': 'ONRC',
  'extranjeria': 'EXTRANJERIA',
  'policia': 'POLICIA',
  'minfp': 'MINFP',
  'itve': 'ITVE',
  'cnedoge-pasaporte': 'CNEDOGE_PASAPORTE',
  'cnedoge-residencia': 'CNEDOGE_RESIDENCIA',
}

export default function AgentBatchListPage() {
  const params = useParams()
  const entitySlug = (params?.entityCode as string) || ''
  const entityCode = ENTITY_CODE_MAP[entitySlug] || entitySlug.toUpperCase().replace(/-/g, '_')

  return (
    <AgentBatchList
      entityCode={entityCode}
      basePath={`/dashboard/agent/${entitySlug}`}
    />
  )
}
