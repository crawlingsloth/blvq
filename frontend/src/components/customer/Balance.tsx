import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function Balance() {
  const { uuid } = useParams<{ uuid: string }>()
  const [isStandalone, setIsStandalone] = useState(false)

  // Save UUID to localStorage when component mounts (for PWA start_url)
  useEffect(() => {
    if (uuid) {
      localStorage.setItem('lastBalanceUuid', uuid)
    }

    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://')
    setIsStandalone(standalone)
  }, [uuid])

  const { data: balance, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['balance', uuid],
    queryFn: () => api.getCustomerBalance(uuid!),
    enabled: !!uuid,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 0, // Always consider data stale
  })

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your balance...</p>
        </div>
      </div>
    )
  }

  if (error || !balance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Found</h2>
          <p className="text-gray-600">
            {(error as Error)?.message || 'Unable to load balance information'}
          </p>
        </div>
      </div>
    )
  }

  const outstandingAmount = balance.total_outstanding

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">BLVQ Balance</h1>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
              title="Refresh balance"
            >
              <svg
                className={`w-5 h-5 text-white ${isFetching ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <p className="text-blue-100">Your Credit Information</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Customer Info */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-1">{balance.customer_name}</h2>
            {balance.customer_phone && (
              <p className="text-blue-100">{balance.customer_phone}</p>
            )}
          </div>

          {/* Outstanding Balance */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">
                Outstanding Balance
              </p>
              <p
                className={`text-5xl font-bold ${
                  outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(outstandingAmount)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Credit Limit</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(balance.credit_limit)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(balance.total_spent)}
                </span>
              </div>

              {balance.loyalty_text && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Loyalty Status</span>
                  <span className="font-semibold text-purple-600">
                    {balance.loyalty_text}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                <span>Last Updated</span>
                <span>{formatDate(balance.last_updated)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          {outstandingAmount > 0 && (
            <div className="bg-red-50 border-t-2 border-red-200 p-4 text-center">
              <p className="text-red-800 text-sm font-medium">
                Please settle your outstanding balance at the shop
              </p>
            </div>
          )}
        </div>

        {/* Install Prompt - Only show if not already installed */}
        {!isStandalone && (
          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              💡 Add this page to your home screen for quick access
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
