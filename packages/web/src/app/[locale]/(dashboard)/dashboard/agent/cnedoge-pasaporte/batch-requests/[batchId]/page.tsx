'use client'

import { useParams } from 'next/navigation'
import { AgentBatchDetail } from '@/modules/agent-dashboard/components/batch'

export default function CnedogePasaporteBatchDetailPage() {
  const params = useParams()
  const batchId = (params?.batchId as string) || ''

  return (
    <AgentBatchDetail
      entityCode="CNEDOGE_PASAPORTE"
      batchId={batchId}
      basePath="/dashboard/agent/cnedoge-pasaporte"
    />
  )
}
