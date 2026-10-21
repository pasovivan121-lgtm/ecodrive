import { Trash2 } from 'lucide-react'
import type { Trip } from '../lib/types'
import { formatDate, formatDuration, formatNumber } from '../lib/trips'
import { Badge } from './ui'

const MODE_TONE = {
  planned: 'brand',
  gps: 'info',
  demo: 'warn',
} as const

const MODE_LABEL = {
  planned: 'Planned',
  gps: 'GPS recorded',
  demo: 'Demo data',
} as const

export function TripRow({
  trip,
  onDelete,
  onSelect,
  selected,
}: {
  trip: Trip
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  selected?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        selected ? 'border-brand/40 bg-brand/5' : 'border-line/80 bg-canvas/40 hover:border-line'
      }`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={onSelect ? () => onSelect(trip.id) : undefined}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{trip.name}</p>
          <Badge tone={MODE_TONE[trip.mode]}>{MODE_LABEL[trip.mode]}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {formatDate(trip.createdAt)} · {trip.vehicleLabel} · {formatDuration(trip.durationMin)}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <span>
            <span className="text-ink">{formatNumber(trip.distanceKm, 1)}</span> km
          </span>
          <span>
            <span className="text-ink">{formatNumber(trip.consumptionPer100km, 1)}</span>{' '}
            {trip.consumptionUnit}
          </span>
          <span>
            <span className="text-ink">{formatNumber(trip.co2Kg, 2)}</span> kg CO₂
          </span>
          <span>
            <span className="text-ink">{formatNumber(trip.costBgn, 2)}</span> BGN
          </span>
        </div>
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(trip.id)}
          className="self-start rounded-lg border border-line p-2 text-muted transition hover:border-danger/40 hover:text-danger sm:self-center"
          aria-label={`Delete ${trip.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
