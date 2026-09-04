// Stock status calculator
export const STOCK_STATUS = {
  IN_STOCK:   'in_stock',
  LOW_STOCK:  'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
}

export function getStockStatus(currentStock, minStockLimit) {
  if (currentStock <= 0)                     return STOCK_STATUS.OUT_OF_STOCK
  if (currentStock <= minStockLimit)         return STOCK_STATUS.LOW_STOCK
  return STOCK_STATUS.IN_STOCK
}

export function stockStatusLabel(status) {
  switch (status) {
    case STOCK_STATUS.IN_STOCK:    return '🟢 In Stock'
    case STOCK_STATUS.LOW_STOCK:   return '🟡 Low Stock'
    case STOCK_STATUS.OUT_OF_STOCK:return '🔴 Out of Stock'
    default:                       return status
  }
}

export function stockStatusColor(status) {
  switch (status) {
    case STOCK_STATUS.IN_STOCK:    return 'bg-emerald-100 text-emerald-800'
    case STOCK_STATUS.LOW_STOCK:   return 'bg-amber-100 text-amber-800'
    case STOCK_STATUS.OUT_OF_STOCK:return 'bg-red-100 text-red-800'
    default:                       return 'bg-gray-100 text-gray-800'
  }
}
