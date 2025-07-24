/**
 * eventApiService - Convenience re-export of event API facade service
 * 
 * Provides a simplified import path for the event API service throughout the application.
 * Acts as a facade entry point to hide the underlying API folder structure from
 * components and other consuming modules.
 * 
 * Design Patterns Applied:
 * - Facade Pattern: Simplifies access to complex subsystem (api/facades/eventApi)
 * - Re-export Pattern: Provides clean import paths for service consumers
 * - Barrel Export Pattern: Centralizes service exports for better organization
 */

// Re-export eventApiService from the facade
export { eventApiService } from './api/facades/eventApi'
