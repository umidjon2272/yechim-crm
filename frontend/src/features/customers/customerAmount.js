export function getCustomerAmount(customer) {
  return Number(customer?.amount ?? customer?.saleAmount ?? customer?.totalAmount ?? customer?.price ?? customer?.value ?? customer?.dealAmount ?? 0) || 0
}

export function formatCustomerAmount(value, currency) {
  return formatCustomerCurrencyAmount(value, currency)
}

export function formatCustomerCurrencyAmount(value, currency) {
  const amount = Number(value || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
  const code = String(currency?.code || 'UZS').toUpperCase()
  if (code === 'UZS') return `${amount} so‘m`
  if (code === 'USD') return `$${amount}`
  if (code === 'EUR') return `€${amount}`
  if (code === 'RUB') return `${amount} ₽`
  if (currency?.symbol) return `${currency.symbol}${amount}`
  return `${amount} ${code}`
}
