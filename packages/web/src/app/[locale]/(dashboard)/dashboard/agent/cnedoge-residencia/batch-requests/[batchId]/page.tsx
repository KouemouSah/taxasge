'use client'

import { useParams } from 'next/navigation'
import { AgentBatchDetail } from '@/modules/agent-dashboard/components/batch'

export default function CnedogeResidenciaBatchDetailPage() {
  const params = useParams()
  const batchId = (params?.batchId as string) || ''

  return (
    <AgentBatchDetail
      entityCode="CNEDOGE_RESIDENCIA"
      batchId={batchId}
      basePath="/dashboard/agent/cnedoge-residencia"
    />
  )
}
