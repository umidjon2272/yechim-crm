export function getCustomerAmount(customer) {
  return Number(customer?.amount ?? customer?.saleAmount ?? customer?.totalAmount ?? customer?.price ?? customer?.value ?? customer?.dealAmount ?? 0) || 0
}

export function formatCustomerAmount(value, currency) {
  return formatCustomerCurrencyAmount(value, currency)
}

export function formatCustomerCurrencyAmount(value, currency) {
  const amount = Number(value || 0).toLocaleString('ru-RU')
  if (currency?.symbol && currency.code !== 'UZS') return `${currency.symbol}${amount}`
  return `${amount} ${currency?.code || 'UZS'}`
}
