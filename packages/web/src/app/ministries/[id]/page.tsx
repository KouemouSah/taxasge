import MinistryDetailClient from './MinistryDetailClient'
import staticIds from '@/data/static-ids.json'

// Generate static params for all ministries at build time
export async function generateStaticParams() {
  return staticIds.ministries
}

export const dynamicParams = false // Only allow pre-generated routes with output: export

export default function MinistryDetailPage() {
  return <MinistryDetailClient />
}
