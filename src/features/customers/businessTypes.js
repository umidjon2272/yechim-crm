export function getCustomerBusinessTypes(customer) {
  if (Array.isArray(customer?.businessTypes) && customer.businessTypes.length) return customer.businessTypes
  return customer?.businessType ? [customer.businessType] : []
}

export function formatCustomerBusinessTypes(customer, limit = Infinity) {
  const names = getCustomerBusinessTypes(customer).map((item) => item.name).filter(Boolean)
  if (!names.length) return ''
  if (names.length <= limit) return names.join(' · ')
  return `${names.slice(0, limit).join(' · ')} +${names.length - limit}`
}
