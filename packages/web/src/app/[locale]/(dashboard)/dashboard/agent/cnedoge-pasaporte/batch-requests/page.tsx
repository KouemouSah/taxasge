'use client'

import { AgentBatchList } from '@/modules/agent-dashboard/components/batch'

export default function CnedogePasaporteBatchListPage() {
  return (
    <AgentBatchList
      entityCode="CNEDOGE_PASAPORTE"
      basePath="/dashboard/agent/cnedoge-pasaporte"
    />
  )
}
