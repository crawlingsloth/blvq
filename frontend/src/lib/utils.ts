export function formatCurrency(amount: number): string {
  return `MVR ${amount.toFixed(2)}`
}

export function formatDate(dateString: string): string {
  // Parse the UTC date string and convert to local time
  const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'))
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
