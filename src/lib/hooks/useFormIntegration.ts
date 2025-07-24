import { useCallback, useMemo, useState } from 'react'

import { useCityExists, useCityValidation } from '@/lib/hooks/tanstack/useCitiesQuery'
import { useEventMutations } from '@/lib/hooks/tanstack/useEventsMutations'
import type { City } from '@/lib/types/city.types'
import type { CreateEventDto } from '@/lib/types/event.types'

/**
 * Form State Management Interface
 * Defines contract for form state operations
 * Follows Interface Segregation Principle
 */
interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isDirty: boolean
}

/**
 * Business Logic Hook: Event Form Management
 * Integrates form state with TanStack Query mutations
 * Follows Single Responsibility: Event form orchestration
 * Implements Dependency Inversion: Abstracts form and query complexity
 */
export function useEventForm(initialData?: Partial<CreateEventDto>) {
  const eventMutations = useEventMutations()
  const cityValidation = useCityValidation()

  // Form state management
  const [formState, setFormState] = useState<FormState<CreateEventDto>>(() => ({
    values: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      city: initialData?.city || '',
      citySlug: initialData?.citySlug || '',
      location: initialData?.location || '',
      date: initialData?.date || '',
      organizerName: initialData?.organizerName || '',
      imageUrl: initialData?.imageUrl || '',
      alt: initialData?.alt || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
    },
    errors: {},
    touched: {},
    isValid: false,
    isDirty: false,
  }))

  // City existence validation
  const cityExists = useCityExists(
    formState.values.citySlug,
    Boolean(formState.values.citySlug)
  )

  // Business logic: Form validation
  const validateForm = useCallback((values: CreateEventDto): Partial<Record<keyof CreateEventDto, string>> => {
    const errors: Partial<Record<keyof CreateEventDto, string>> = {}

    // Required field validation
    if (!values.name.trim()) {
      errors.name = 'Event name is required'
    } else if (values.name.length > 200) {
      errors.name = 'Event name too long (max 200 characters)'
    }

    if (!values.description.trim()) {
      errors.description = 'Event description is required'
    } else if (values.description.length > 1000) {
      errors.description = 'Description too long (max 1000 characters)'
    }

    if (!values.location.trim()) {
      errors.location = 'Event location is required'
    }

    if (!values.date) {
      errors.date = 'Event date is required'
    } else {
      const eventDate = new Date(values.date)
      const now = new Date()
      if (eventDate < now) {
        errors.date = 'Event date must be in the future'
      }
    }

    if (!values.organizerName.trim()) {
      errors.organizerName = 'Organizer name is required'
    }

    if (!values.imageUrl.trim()) {
      errors.imageUrl = 'Event image URL is required'
    } else {
      try {
        new URL(values.imageUrl)
      } catch {
        errors.imageUrl = 'Invalid image URL format'
      }
    }

    if (!values.alt.trim()) {
      errors.alt = 'Image alt text is required'
    }

    if (values.price < 0) {
      errors.price = 'Price cannot be negative'
    } else if (values.price > 10000) {
      errors.price = 'Price too high (max $10,000)'
    }

    // City validation
    if (!values.citySlug.trim()) {
      errors.citySlug = 'City selection is required'
    } else {
      const cityValidationResult = cityValidation.validateCitySlug(values.citySlug)
      if (!cityValidationResult.isValid) {
        errors.citySlug = cityValidationResult.error
      } else if (cityExists.data && !cityExists.data.exists) {
        errors.citySlug = 'Selected city does not exist'
      }
    }

    // Slug validation and auto-generation
    if (!values.slug.trim()) {
      // Auto-generate slug from name if not provided
      const autoSlug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      if (!autoSlug) {
        errors.slug = 'Event slug is required'
      }
    } else if (values.slug.length > 100) {
      errors.slug = 'Slug too long (max 100 characters)'
    } else if (!/^[a-z0-9-]+$/.test(values.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    return errors
  }, [cityValidation, cityExists.data])

  // Form field update handler
  const updateField = useCallback(<K extends keyof CreateEventDto>(
    field: K,
    value: CreateEventDto[K]
  ) => {
    setFormState(prev => {
      // eslint-disable-next-line security/detect-object-injection
      const newValues = { ...prev.values, [field]: value }
      
      // Auto-generate slug when name changes
      if (field === 'name' && !prev.touched.slug) {
        newValues.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      const errors = validateForm(newValues)
      const isValid = Object.keys(errors).length === 0
      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialData || {})

      return {
        values: newValues,
        errors,
        touched: { ...prev.touched, [field]: true },
        isValid,
        isDirty,
      }
    })
  }, [validateForm, initialData])

  // Form submission handler
  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formState.values)
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({
        ...prev,
        errors,
        touched: Object.keys(prev.values).reduce((acc, key) => {
          // eslint-disable-next-line security/detect-object-injection
          acc[key as keyof CreateEventDto] = true
          return acc
        }, {} as Partial<Record<keyof CreateEventDto, boolean>>),
      }))
      return false
    }

    try {
      await eventMutations.createEvent(formState.values)
      return true
    } catch {
      // Handle submission error
      setFormState(prev => ({
        ...prev,
        errors: { name: 'Failed to create event. Please try again.' },
      }))
      return false
    }
  }, [formState.values, validateForm, eventMutations])

  // Reset form handler
  const resetForm = useCallback(() => {
    setFormState({
      values: {
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        city: initialData?.city || '',
        citySlug: initialData?.citySlug || '',
        location: initialData?.location || '',
        date: initialData?.date || '',
        organizerName: initialData?.organizerName || '',
        imageUrl: initialData?.imageUrl || '',
        alt: initialData?.alt || '',
        description: initialData?.description || '',
        price: initialData?.price || 0,
      },
      errors: {},
      touched: {},
      isValid: false,
      isDirty: false,
    })
  }, [initialData])

  return {
    // Form state
    formState,
    
    // Form operations
    updateField,
    handleSubmit,
    resetForm,
    
    // Mutation state
    isSubmitting: eventMutations.createMutation.isPending,
    submitError: eventMutations.createMutation.error,
    
    // City validation
    cityValidation: {
      isValidating: cityExists.isLoading,
      exists: cityExists.data?.exists,
      error: cityExists.error,
    },
    
    // Helper methods
    getFieldError: (field: keyof CreateEventDto) => 
      formState.touched[field] ? formState.errors[field] : undefined,
    
    setFieldTouched: (field: keyof CreateEventDto) => {
      setFormState(prev => ({
        ...prev,
        // eslint-disable-next-line security/detect-object-injection
        touched: { ...prev.touched, [field]: true },
      }))
    },
  }
}

/**
 * Business Logic Hook: City Selection Form
 * Manages city selection with search and validation
 * Follows Open/Closed Principle: Extensible for different selection modes
 */
export function useCitySelectionForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const cityValidation = useCityValidation()

  // Debounced search (simplified - would use actual debouncing in production)
  const debouncedSearch = useMemo(() => searchQuery, [searchQuery])

  // City selection handler
  const selectCity = useCallback((city: City) => {
    const validationResult = cityValidation.validateCitySlug(city.citySlug)
    
    if (validationResult.isValid) {
      setSelectedCity(city)
      setSearchQuery(city.city)
    }
  }, [cityValidation])

  // Clear selection handler
  const clearSelection = useCallback(() => {
    setSelectedCity(null)
    setSearchQuery('')
  }, [])

  // Search handler
  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query)
    
    // Clear selection if search doesn't match selected city
    if (selectedCity && !selectedCity.city.toLowerCase().includes(query.toLowerCase())) {
      setSelectedCity(null)
    }
  }, [selectedCity])

  return {
    // Selection state
    searchQuery,
    selectedCity,
    debouncedSearch,
    
    // Selection operations
    selectCity,
    clearSelection,
    updateSearch,
    
    // Validation
    isValidSelection: Boolean(selectedCity),
    validationError: selectedCity ? undefined : 'Please select a city',
    
    // Helper methods
    isSelected: (city: City) => selectedCity?.citySlug === city.citySlug,
    
    getSelectionData: () => selectedCity ? {
      city: selectedCity.city,
      citySlug: selectedCity.citySlug,
    } : null,
  }
}

/**
 * Business Logic Hook: Multi-Step Form Management
 * Manages complex multi-step form workflows
 * Implements State Machine pattern for form steps
 */
export function useMultiStepForm<T extends Record<string, unknown>>(
  steps: Array<{
    id: string
    name: string
    validate: (data: Partial<T>) => boolean
  }>
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  // Step navigation
  const nextStep = useCallback(() => {
    if (!isLastStep && currentStep.validate(formData)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep.id))
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [isLastStep, currentStep, formData])

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [isFirstStep])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex)
    }
  }, [steps.length])

  // Data management
  const updateStepData = useCallback((stepData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }, [])

  const resetForm = useCallback(() => {
    setCurrentStepIndex(0)
    setFormData({})
    setCompletedSteps(new Set())
  }, [])

  // Form completion
  const canCompleteForm = useMemo(() => {
    return steps.every(step => step.validate(formData))
  }, [steps, formData])

  return {
    // Current state
    currentStep,
    currentStepIndex,
    formData,
    
    // Navigation state
    isFirstStep,
    isLastStep,
    completedSteps,
    
    // Navigation operations
    nextStep,
    previousStep,
    goToStep,
    
    // Data operations
    updateStepData,
    resetForm,
    
    // Validation
    canCompleteForm,
    isStepValid: currentStep.validate(formData),
    isStepCompleted: (stepId: string) => completedSteps.has(stepId),
    
    // Progress
    progress: Math.round(((currentStepIndex + 1) / steps.length) * 100),
    completedCount: completedSteps.size,
  }
}

/**
 * Utility Types for Form Hook Consumers
 */
export type EventFormResult = ReturnType<typeof useEventForm>
export type CitySelectionFormResult = ReturnType<typeof useCitySelectionForm>
export type MultiStepFormResult<T> = ReturnType<typeof useMultiStepForm<T>>

/**
 * Form Hook Factory: Creates specialized form hooks
 * Implements Factory Pattern for form creation
 * Follows Dependency Inversion: Configurable validation and behavior
 */
export const createFormHook = <T extends Record<string, unknown>>(config: {
  initialData?: Partial<T>
  validationRules?: Partial<Record<keyof T, (value: T[keyof T]) => string | undefined>>
  autoSave?: boolean
  autoSaveDelay?: number
}) => {
  return function useConfiguredForm() {
    const [values, setValues] = useState<Partial<T>>(config.initialData || {})
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

    const validateField = useCallback((field: keyof T, value: T[keyof T]) => {
      const rule = config.validationRules?.[field]
      return rule ? rule(value) : undefined
    }, [])

    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [field]: value }))
      
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
      setTouched(prev => ({ ...prev, [field]: true }))
    }, [validateField])

    const isValid = useMemo(() => {
      return Object.values(errors).every(error => !error)
    }, [errors])

    return {
      values,
      errors,
      touched,
      isValid,
      updateField,
      validateField,
      reset: () => {
        setValues(config.initialData || {})
        setErrors({})
        setTouched({})
      },
    }
  }
}