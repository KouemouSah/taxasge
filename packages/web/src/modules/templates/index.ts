/**
 * Templates Module
 * Document and procedure templates management
 *
 * @module templates
 */

// Components
export * from './components'

// Hooks
export * from './hooks'

// Types
export * from './types'

// Services
export {
  documentTemplatesApi,
  procedureTemplatesApi,
  procedureStepsApi,
} from './services/api'
export { default as templatesApi } from './services/api'
