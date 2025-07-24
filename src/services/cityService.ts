/**
 * cityService - Convenience re-export of city API facade service
 * 
 * Provides a simplified import path for the city API service throughout the application.
 * Acts as a facade entry point to hide the underlying API folder structure from
 * components and other consuming modules.
 * 
 * Design Patterns Applied:
 * - Facade Pattern: Simplifies access to complex subsystem (api/facades/cityApi)
 * - Re-export Pattern: Provides clean import paths for service consumers
 * - Barrel Export Pattern: Centralizes service exports for better organization
 */

// Re-export cityApiService as cityService from the facade
export { cityApiService as cityService } from './api/facades/cityApi'
