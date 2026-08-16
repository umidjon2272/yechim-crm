export function getCustomerAmount(customer) {
  return Number(customer?.amount ?? customer?.saleAmount ?? customer?.totalAmount ?? customer?.price ?? customer?.value ?? customer?.dealAmount ?? 0) || 0
}

export function formatCustomerAmount(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} so'm`
}
