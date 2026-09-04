import React from 'react'
import { cn } from '../../utils/cn'

export const BADGE_STYLES = {
  // Stock
  in_stock:           'bg-emerald-100 text-emerald-800',
  low_stock:          'bg-amber-100 text-amber-800',
  out_of_stock:       'bg-red-100 text-red-800',
  // Request
  pending:            'bg-gray-100 text-gray-700',
  under_review:       'bg-blue-100 text-blue-700',
  approved:           'bg-green-100 text-green-800',
  ordered:            'bg-indigo-100 text-indigo-800',
  partially_received: 'bg-amber-100 text-amber-800',
  fully_received:     'bg-emerald-100 text-emerald-800',
  short_supply:       'bg-orange-100 text-orange-800',
  completed:          'bg-emerald-100 text-emerald-800',
  rejected:           'bg-red-100 text-red-800',
  cancelled:          'bg-red-100 text-red-800',
  // Bill
  pending_verification: 'bg-gray-100 text-gray-700',
  verified:             'bg-emerald-100 text-emerald-800',
  correction_required:  'bg-amber-100 text-amber-800',
  // Payment
  paid:               'bg-emerald-100 text-emerald-800',
  partially_paid:     'bg-amber-100 text-amber-800',
  // Generic
  open:               'bg-orange-100 text-orange-800',
  resolved:           'bg-emerald-100 text-emerald-800',
  draft:              'bg-gray-100 text-gray-700',
  active:             'bg-emerald-100 text-emerald-800',
  inactive:           'bg-red-100 text-red-800',
  info:               'bg-blue-100 text-blue-700',
  warning:            'bg-amber-100 text-amber-800',
  error:              'bg-red-100 text-red-800',
  success:            'bg-emerald-100 text-emerald-800',
}

const BADGE_LABELS = {
  in_stock:             '🟢 In Stock',
  low_stock:            '🟡 Low Stock',
  out_of_stock:         '🔴 Out of Stock',
  pending:              'Pending',
  under_review:         'Under Review',
  approved:             'Approved',
  ordered:              'Ordered',
  partially_received:   'Partially Received',
  fully_received:       'Fully Received',
  short_supply:         'Short Supply',
  completed:            'Completed',
  rejected:             'Rejected',
  cancelled:            'Cancelled',
  pending_verification: 'Pending Verification',
  verified:             'Verified',
  correction_required:  'Correction Required',
  paid:                 '✅ Paid',
  partially_paid:       '🟡 Partially Paid',
  open:                 'Open',
  resolved:             'Resolved',
  draft:                'Draft',
  active:               'Active',
  inactive:             'Inactive',
}

export function StatusBadge({ status, className }) {
  const style = BADGE_STYLES[status] || 'bg-gray-100 text-gray-700'
  const label = BADGE_LABELS[status] || status?.replace(/_/g, ' ') || '—'
  return (
    <span className={cn('badge', style, className)}>
      {label}
    </span>
  )
}
