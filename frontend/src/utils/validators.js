export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function minLength(value, length) {
  return String(value ?? '').length >= length
}

export function validate(values, rules) {
  const errors = {}
  Object.entries(rules).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      const result = rule(values[field], values)
      if (result) {
        errors[field] = result
        break
      }
    }
  })
  return errors
}

export const rules = {
  required:
    (message = 'Bu maydon majburiy') =>
    (value) =>
      isRequired(value) ? undefined : message,
  email:
    (message = 'Elektron pochta manzili noto‘g‘ri') =>
    (value) =>
      !value || isEmail(value) ? undefined : message,
  minLength:
    (length, message) =>
    (value) =>
      !value || minLength(value, length) ? undefined : message || `Kamida ${length} ta belgi bo‘lishi kerak`,
}
