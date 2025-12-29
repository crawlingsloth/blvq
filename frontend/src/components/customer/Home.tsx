import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function Home() {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Redirect to saved balance page if exists (for PWA)
  useEffect(() => {
    const savedUuid = localStorage.getItem('lastBalanceUuid')
    if (savedUuid) {
      navigate(`/balance/${savedUuid}`, { replace: true })
    }
  }, [navigate])

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setScanError(null)
      setIsScanning(true)

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned QR code
          console.log('Scanned:', decodedText)

          // Extract UUID from URL or use as-is
          let uuid = decodedText

          // If it's a full URL, extract the UUID
          if (decodedText.includes('/balance/')) {
            const parts = decodedText.split('/balance/')
            uuid = parts[1]
          }

          // Clean up any query params or hash
          uuid = uuid.split('?')[0].split('#')[0]

          // Stop scanner and navigate
          scanner.stop().then(() => {
            setIsScanning(false)
            navigate(`/balance/${uuid}`)
          })
        },
        (error) => {
          // Ignore scanning errors (just means no QR code in frame)
          // console.log('Scan error:', error)
        }
      )
    } catch (error) {
      console.error('Scanner error:', error)
      setScanError('Unable to access camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false)
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">BLVQ</h1>
          <p className="text-gray-600">Check your shop credit balance</p>
        </div>

        {!isScanning ? (
          <div className="space-y-4">
            {/* Scan Button */}
            <button
              onClick={startScanning}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
            >
              📷 Scan QR Code
            </button>

            {scanError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {scanError}
              </div>
            )}

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                How it works
              </h2>
              <p className="text-gray-600 text-sm">
                Tap the button above to open your camera and scan your unique QR code from the shop
              </p>
            </div>

            <div className="border-t-2 border-gray-200 pt-4">
              <Link
                to="/admin/login"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Staff Login →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scanner View */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div id="qr-reader" className="w-full"></div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Position the QR code within the frame
              </p>
              <button
                onClick={stopScanning}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by BLVQ</p>
        </div>
      </div>
    </div>
  )
}
