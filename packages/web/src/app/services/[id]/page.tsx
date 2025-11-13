import ServiceDetailClient from './ServiceDetailClient'
import staticIds from '@/data/static-ids.json'

// Generate static params for all services at build time
export async function generateStaticParams() {
  return staticIds.services
}

export const dynamicParams = false // Only allow pre-generated routes with output: export

export default function ServiceDetailPage() {
  return <ServiceDetailClient />
}
