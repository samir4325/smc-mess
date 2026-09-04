import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, className }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-500',    text: 'text-blue-600'   },
    green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-600'  },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-500',     text: 'text-red-600'    },
    purple: { bg: 'bg-purple-50',  icon: 'bg-purple-500',  text: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-50',  icon: 'bg-indigo-500',  text: 'text-indigo-600' },
    gray:   { bg: 'bg-gray-50',    icon: 'bg-gray-500',    text: 'text-gray-600'   },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={cn('card p-5 flex items-start gap-4', className)}>
      {Icon && (
        <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', c.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
        <p className={cn('text-2xl font-bold mt-0.5', c.text)}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={cn('text-xs font-medium flex items-center gap-0.5', trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400')}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
