'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Keyboard, X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  disabled?: boolean
  placeholder?: string
}

export function BarcodeScanner({ onScan, disabled, placeholder = 'Escanea o escribe el código...' }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'gun' | 'camera'>('gun')
  const [inputValue, setInputValue] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastKeyTime = useRef(0)
  const bufferRef = useRef('')
  const scannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mode === 'gun' && inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [mode, disabled])

  // Re-focus on click anywhere (for gun mode)
  useEffect(() => {
    if (mode !== 'gun') return
    const handler = () => inputRef.current?.focus()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [mode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      onScan(inputValue.trim())
      setInputValue('')
    }
  }, [inputValue, onScan])

  // Camera mode with html5-qrcode
  useEffect(() => {
    if (mode !== 'camera' || !cameraActive || !scannerRef.current) return

    let scanner: import('html5-qrcode').Html5Qrcode | null = null

    const initCamera = async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      scanner = new Html5Qrcode('barcode-scanner-view')
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText)
            playBeep(true)
          },
          () => {}
        )
      } catch (err) {
        console.warn('[BarcodeScanner] Camera error:', err)
      }
    }

    initCamera()

    return () => {
      scanner?.stop().catch(() => {})
    }
  }, [mode, cameraActive, onScan])

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('gun'); setCameraActive(false) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            mode === 'gun' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Keyboard className="h-4 w-4" /> Pistola / Manual
        </button>
        <button
          onClick={() => { setMode('camera'); setCameraActive(true) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Camera className="h-4 w-4" /> Cámara
        </button>
      </div>

      {mode === 'gun' && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus
            className="w-full px-4 py-4 text-lg border-2 border-blue-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white font-mono disabled:opacity-50"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(''); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {mode === 'camera' && cameraActive && (
        <div className="relative">
          <div id="barcode-scanner-view" ref={scannerRef} className="rounded-2xl overflow-hidden" />
          <button
            onClick={() => setCameraActive(false)}
            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function playBeep(success: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = success ? 880 : 220
    gain.gain.value = 0.3
    osc.start()
    osc.stop(ctx.currentTime + (success ? 0.15 : 0.3))
  } catch {}
}

export { playBeep }
