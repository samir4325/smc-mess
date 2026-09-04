// ID generator utilities
const pad = (n, width = 3) => String(n).padStart(width, '0')

export function generateId(prefix, counter) {
  return `${prefix}-${pad(counter)}`
}

export const ID_PREFIXES = {
  request:       'REQ',
  purchase:      'PUR',
  grn:           'GRN',
  stockOut:      'STKOUT',
  shortSupply:   'SS',
  bill:          'BILL',
  payment:       'PAY',
  vendor:        'VEN',
  item:          'ITEM',
  category:      'CAT',
  user:          'USR',
}
