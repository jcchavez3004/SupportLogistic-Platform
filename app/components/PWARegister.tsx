'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[PWA] Service Worker registrado'))
        .catch((err) => console.warn('[PWA] Error registrando SW:', err))
    }
  }, [])
  return null
}
