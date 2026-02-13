'use client'

import { AgentBatchList } from '@/modules/agent-dashboard/components/batch'

export default function CnedogeResidenciaBatchListPage() {
  return (
    <AgentBatchList
      entityCode="CNEDOGE_RESIDENCIA"
      basePath="/dashboard/agent/cnedoge-residencia"
    />
  )
}
