export function formatCurrency(amount: number): string {
  return `MVR ${amount.toFixed(2)}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}
