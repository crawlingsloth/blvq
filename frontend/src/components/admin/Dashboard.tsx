import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { QRCodeSVG } from 'qrcode.react'
import type { EwityCustomer, CustomerLink } from '../../types'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<EwityCustomer | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)

  // Fetch linked customers
  const { data: linkedCustomers = [] } = useQuery({
    queryKey: ['customerLinks'],
    queryFn: () => api.getCustomerLinks(),
  })

  // Search customers
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['searchCustomers', searchQuery],
    queryFn: () => api.searchCustomers(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  // Link customer mutation
  const linkMutation = useMutation({
    mutationFn: api.linkCustomer.bind(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerLinks'] })
      setSelectedCustomer(null)
      setSearchQuery('')
      alert('Customer linked successfully!')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  // Delete link mutation
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => api.deleteCustomerLink(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerLinks'] })
      setShowQR(null)
      alert('Link removed successfully!')
    },
  })

  // Refresh customer data mutation
  const refreshMutation = useMutation({
    mutationFn: () => api.refreshCustomerData(),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['searchCustomers'] })
        alert(`✓ Synced ${result.total} customers (${result.new} new, ${result.updated} updated)`)
      } else {
        alert(`Error: ${result.error}`)
      }
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleLogout = () => {
    api.logout()
    navigate('/admin/login')
  }

  const handleRefresh = () => {
    if (confirm('Refresh customer data from Ewity? This may take a few seconds.')) {
      refreshMutation.mutate()
    }
  }

  const handleLinkCustomer = () => {
    if (!selectedCustomer) return

    linkMutation.mutate({
      ewity_customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name || undefined,
      customer_phone: selectedCustomer.mobile || undefined,
    })
  }

  const downloadQR = (uuid: string, customerName: string) => {
    const canvas = document.getElementById(`qr-${uuid}`) as HTMLCanvasElement
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `${customerName.replace(/\s+/g, '_')}_QR.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">BLVQ Admin</h1>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Link New Customer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Link New Customer
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Name or Phone
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name or phone number..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {isSearching && (
                <p className="text-gray-600 text-sm">Searching...</p>
              )}

              {searchResults && searchResults.data.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {searchResults.data.map((customer) => {
                    const isLinked = linkedCustomers.some(
                      (link) => link.ewity_customer_id === customer.id
                    )

                    return (
                      <button
                        key={customer.id}
                        onClick={() => !isLinked && setSelectedCustomer(customer)}
                        disabled={isLinked}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-blue-50 border-l-4 border-l-blue-600'
                            : ''
                        } ${isLinked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="font-medium text-gray-800">
                          {customer.name}
                          {isLinked && (
                            <span className="ml-2 text-xs text-green-600">
                              ✓ Already Linked
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{customer.mobile}</p>
                        <p className="text-xs text-gray-500">
                          Outstanding: MVR {customer.total_outstanding || 0}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              {searchQuery.length >= 2 &&
                searchResults &&
                searchResults.data.length === 0 && (
                  <p className="text-gray-600 text-sm">No customers found</p>
                )}

              {selectedCustomer && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="font-medium text-gray-800">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.mobile}
                    </p>
                  </div>

                  <button
                    onClick={handleLinkCustomer}
                    disabled={linkMutation.isPending}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {linkMutation.isPending ? 'Linking...' : 'Link Customer'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Linked Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Linked Customers ({linkedCustomers.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {linkedCustomers.map((link: CustomerLink) => (
                <div
                  key={link.uuid}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {link.customer_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {link.customer_phone}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setShowQR(showQR === link.uuid ? null : link.uuid)
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showQR === link.uuid ? 'Hide QR' : 'Show QR'}
                    </button>
                  </div>

                  {showQR === link.uuid && (
                    <div className="mt-4 border-t pt-4">
                      <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                        <QRCodeSVG
                          id={`qr-${link.uuid}`}
                          value={`https://blvq.crawlingsloth.cloud/balance/${link.uuid}`}
                          size={200}
                          level="H"
                          includeMargin
                        />

                        <div className="mt-4 space-x-2">
                          <button
                            onClick={() =>
                              downloadQR(link.uuid, link.customer_name || 'customer')
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Download QR
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm('Are you sure you want to remove this link?')
                              ) {
                                deleteMutation.mutate(link.uuid)
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-gray-500 break-all text-center">
                          {`https://blvq.crawlingsloth.cloud/balance/${link.uuid}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {linkedCustomers.length === 0 && (
                <p className="text-gray-600 text-center py-8">
                  No customers linked yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
