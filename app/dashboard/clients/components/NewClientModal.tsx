'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { createNewClient, updateClient, getClientServiceTypes } from '@/app/dashboard/clients/actions'
import { Package, MapPinned, Loader2 } from 'lucide-react'

interface ServiceType {
  id: string
  name: string
  description: string
  requires_zoning: boolean
}

interface ClientData {
  id: string
  company_name: string
  nit: string | null
  address: string | null
  logo_url: string | null
}

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  serviceTypes: ServiceType[]
  editingClient?: ClientData | null
}

export function NewClientModal({ isOpen, onClose, serviceTypes, editingClient }: NewClientModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEditMode = !!editingClient

  // Resetear estado cuando cambia el cliente a editar o se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedServices([])
      setServicesError(null)
      setSubmitError(null)
      setIsLoadingServices(false)
      formRef.current?.reset()
    }
  }, [isOpen])

  // Cargar tipos de servicio del cliente cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && editingClient) {
      setIsLoadingServices(true)
      setServicesError(null)
      setSubmitError(null)
      
      getClientServiceTypes(editingClient.id)
        .then((serviceIds) => {
          console.log('Loaded client services:', serviceIds)
          setSelectedServices(serviceIds)
        })
        .catch((error) => {
          console.error('Error loading client services:', error)
          setServicesError('No se pudieron cargar los servicios del cliente')
        })
        .finally(() => {
          setIsLoadingServices(false)
        })
    } else if (isOpen && !editingClient) {
      // Modo crear: seleccionar servicio por defecto
      const defaultService = serviceTypes.find(st => !st.requires_zoning)
      if (defaultService) {
        setSelectedServices([defaultService.id])
      }
    }
  }, [isOpen, editingClient, serviceTypes])

  // Controlar apertura/cierre del dialog
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [isOpen])

  const handleServiceToggle = useCallback((serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setSubmitError(null)
    
    if (selectedServices.length === 0) {
      setSubmitError('Debes seleccionar al menos un tipo de servicio')
      return
    }

    setIsSubmitting(true)
    try {
      // Agregar los servicios seleccionados al formData
      formData.set('serviceTypes', JSON.stringify(selectedServices))
      
      if (isEditMode && editingClient) {
        formData.set('clientId', editingClient.id)
        console.log('Updating client:', editingClient.id, 'with services:', selectedServices)
        
        const result = await updateClient(formData)
        
        if (!result.success) {
          console.error('updateClient returned error:', result.error)
          setSubmitError(result.error || 'Error al actualizar el cliente')
          return
        }
        
        console.log('Client updated successfully')
      } else {
        await createNewClient(formData)
        console.log('Client created successfully')
      }
      
      formRef.current?.reset()
      setSelectedServices([])
      onClose()
    } catch (error) {
      console.error('Error saving client:', error)
      setSubmitError(
        isEditMode 
          ? 'Error al actualizar el cliente. Intenta de nuevo.' 
          : 'Error al crear el cliente. Intenta de nuevo.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedServices([])
    setServicesError(null)
    setSubmitError(null)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-2xl p-0 w-full max-w-lg backdrop:bg-black/50"
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form 
          ref={formRef} 
          action={handleSubmit} 
          className="space-y-5"
          key={editingClient?.id || 'new-client'}
        >
          {/* Datos básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre Empresa *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required
                defaultValue={editingClient?.company_name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Empresa S.A."
              />
            </div>

            <div>
              <label
                htmlFor="nit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                NIT
              </label>
              <input
                type="text"
                id="nit"
                name="nit"
                defaultValue={editingClient?.nit || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: 12345678-9"
              />
            </div>

            <div>
              <label
                htmlFor="logo_url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL Logo
              </label>
              <input
                type="url"
                id="logo_url"
                name="logo_url"
                defaultValue={editingClient?.logo_url || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dirección
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={editingClient?.address || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Dirección completa"
            />
          </div>

          {/* Sección de Tipos de Servicio */}
          <div className="border-t pt-5">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Tipos de Servicio Habilitados *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Selecciona los servicios que este cliente podrá solicitar.
            </p>
            
            {/* Estado de carga */}
            {isLoadingServices && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-sm text-gray-500">Cargando servicios...</span>
              </div>
            )}

            {/* Error al cargar servicios */}
            {servicesError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{servicesError}</p>
                <p className="text-xs text-red-500 mt-1">Puedes continuar editando los otros datos.</p>
              </div>
            )}

            {/* Lista de tipos de servicio */}
            {!isLoadingServices && serviceTypes.length === 0 && !servicesError && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">
                  No hay tipos de servicio configurados en el sistema.
                </p>
              </div>
            )}
            
            {!isLoadingServices && serviceTypes.length > 0 && (
              <div className="space-y-3">
                {serviceTypes.map((service) => {
                  const isSelected = selectedServices.includes(service.id)
                  const Icon = service.requires_zoning ? MapPinned : Package
                  
                  return (
                    <label
                      key={service.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleServiceToggle(service.id)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-indigo-500' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {service.name}
                          </span>
                          {service.requires_zoning && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                              Zonas
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {service.description}
                        </p>
                      </div>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {!isLoadingServices && selectedServices.length === 0 && serviceTypes.length > 0 && (
              <p className="text-xs text-red-500 mt-2">
                Selecciona al menos un tipo de servicio
              </p>
            )}
          </div>

          {/* Mensaje de error de submit */}
          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingServices || (selectedServices.length === 0 && serviceTypes.length > 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting 
                ? (isEditMode ? 'Guardando...' : 'Creando...') 
                : (isEditMode ? 'Guardar Cambios' : 'Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
