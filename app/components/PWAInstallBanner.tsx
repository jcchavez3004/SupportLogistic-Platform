'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const standalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsIOS(ios)

    if (standalone) return
    if (localStorage.getItem('pwa-banner-dismissed')) return

    if (ios) {
      setTimeout(() => setShowBanner(true), 3000)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShowBanner(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-800 text-white rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Instalar SupportLogistic</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Instala la app para acceso rápido sin abrir el navegador
            </p>
          </div>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-white flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
        >
          {isIOS ? 'Ver instrucciones' : 'Instalar ahora'}
        </button>
      </div>

      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Instalar en iPhone/iPad</h3>
              <button onClick={() => setShowIOSInstructions(false)}>
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'Toca el botón compartir  ⎋  en la barra inferior de Safari' },
                { step: '2', text: 'Desplázate hacia abajo y toca "Añadir a pantalla de inicio"' },
                { step: '3', text: 'Toca "Añadir" en la esquina superior derecha' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step}
                  </span>
                  <p className="text-sm text-gray-700 pt-0.5">{text}</p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-400 text-center">
              Solo funciona desde Safari (no Chrome ni Firefox en iOS)
            </p>
          </div>
        </div>
      )}
    </>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
