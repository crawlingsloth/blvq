import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function Balance() {
  const { uuid } = useParams<{ uuid: string }>()

  const { data: balance, isLoading, error } = useQuery({
    queryKey: ['balance', uuid],
    queryFn: () => api.getCustomerBalance(uuid!),
    enabled: !!uuid,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

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
          <h1 className="text-3xl font-bold text-white mb-1">BLVQ Balance</h1>
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

        {/* Install Prompt */}
        <div className="mt-6 text-center">
          <p className="text-white text-sm">
            Add this page to your home screen for quick access
          </p>
        </div>
      </div>
    </div>
  )
}
