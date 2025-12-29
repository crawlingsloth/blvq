import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Home() {
  const navigate = useNavigate()

  // Redirect to saved balance page if exists (for PWA)
  useEffect(() => {
    const savedUuid = localStorage.getItem('lastBalanceUuid')
    if (savedUuid) {
      navigate(`/balance/${savedUuid}`, { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">BLVQ</h1>
          <p className="text-gray-600">Check your shop credit balance</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-blue-600"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Scan Your QR Code
            </h2>
            <p className="text-gray-600 text-sm">
              Ask the shop staff for your unique QR code and scan it to view your balance
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

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by BLVQ</p>
        </div>
      </div>
    </div>
  )
}
