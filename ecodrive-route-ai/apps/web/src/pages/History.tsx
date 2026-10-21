import { useMemo, useState } from 'react'
import { Download, History as HistoryIcon, MapPin, Search, Trash2 } from 'lucide-react'
import { useAppStore } from '../store'
import { formatDate, formatDuration, formatNumber, tripsToCsv } from '../lib/trips'
import type { TripMode } from '../lib/types'
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui'
import { RouteMap } from '../components/RouteMap'
import { TripRow } from '../components/TripRow'

const FILTERS: { id: 'all' | TripMode; label: string }[] = [
  { id: 'all', label: 'All trips' },
  { id: 'planned', label: 'Planned' },
  { id: 'gps', label: 'GPS recorded' },
  { id: 'demo', label: 'Demo data' },
]

export function History() {
  const trips = useAppStore((state) => state.trips)
  const removeTrip = useAppStore((state) => state.removeTrip)
  const clearTrips = useAppStore((state) => state.clearTrips)

  const [filter, setFilter] = useState<'all' | TripMode>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return trips.filter((trip) => {
      if (filter !== 'all' && trip.mode !== filter) return false
      if (!search) return true
      return `${trip.name} ${trip.vehicleLabel} ${trip.originLabel} ${trip.destinationLabel}`
        .toLowerCase()
        .includes(search)
    })
  }, [trips, filter, query])

  const selectedTrip = filtered.find((trip) => trip.id === selectedId) ?? filtered[0]

  const handleDelete = (id: string) => {
    removeTrip(id)
    if (selectedId === id) setSelectedId(null)
  }

  const handleExport = () => {
    const csv = tripsToCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ecodrive-trips-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        eyebrow="Trip History"
        title="Every trip, stored locally"
        description="Filter by source, inspect a trip on the map, export to CSV or remove entries. Demo rows stay distinguishable from real records."
        actions={
          <>
            <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Delete all trips stored in this browser?')) {
                  clearTrips()
                  setSelectedId(null)
                }
              }}
              disabled={trips.length === 0}
            >
              <Trash2 className="h-4 w-4" /> Delete all
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filter === option.id
                  ? 'border-brand/40 bg-brand/10 text-brand-2'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {option.label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {option.id === 'all'
                  ? trips.length
                  : trips.filter((trip) => trip.mode === option.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search trips"
            className="pl-9"
            aria-label="Search trips"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            icon={<HistoryIcon className="h-7 w-7" />}
            title={trips.length === 0 ? 'No trips stored yet' : 'No trips match this filter'}
            description={
              trips.length === 0
                ? 'Plan a route in EcoRoute or record a GPS trip in Analytics. Demo data can be loaded from those pages.'
                : 'Try a different source filter or clear the search.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-7">
            {filtered.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                selected={trip.id === selectedTrip?.id}
                onSelect={setSelectedId}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className="lg:col-span-5">
            {selectedTrip ? (
              <Card className="p-5 lg:sticky lg:top-20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">{selectedTrip.name}</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(selectedTrip.createdAt)} · {selectedTrip.vehicleLabel}
                    </p>
                  </div>
                  <Badge tone={selectedTrip.mode === 'demo' ? 'warn' : 'brand'}>
                    {selectedTrip.mode === 'demo'
                      ? 'Demo data'
                      : selectedTrip.mode === 'gps'
                        ? 'GPS recorded'
                        : 'Planned'}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Distance', value: `${formatNumber(selectedTrip.distanceKm, 2)} km` },
                    { label: 'Duration', value: formatDuration(selectedTrip.durationMin) },
                    {
                      label: 'Consumption',
                      value: `${formatNumber(selectedTrip.consumptionPer100km, 1)} ${selectedTrip.consumptionUnit}`,
                    },
                    { label: 'CO₂', value: `${formatNumber(selectedTrip.co2Kg, 2)} kg` },
                    { label: 'Cost', value: `${formatNumber(selectedTrip.costBgn, 2)} BGN` },
                    {
                      label: 'Electricity',
                      value: `${formatNumber(selectedTrip.electricityKwh, 2)} kWh`,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] uppercase tracking-wider text-muted">{item.label}</p>
                      <p className="mt-0.5 tabular-nums text-ink">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-lg border border-line bg-canvas/40 p-2.5 text-xs text-muted">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-2" />
                    <span>
                      {selectedTrip.originLabel} → {selectedTrip.destinationLabel}
                    </span>
                  </p>
                </div>

                {selectedTrip.track && selectedTrip.track.length > 1 ? (
                  <div className="mt-3">
                    <RouteMap
                      routes={[
                        {
                          id: `trip-${selectedTrip.id}`,
                          coordinates: selectedTrip.track,
                          emphasis: 'primary',
                        },
                      ]}
                      height={220}
                    />
                    <p className="mt-1 text-[10px] text-muted/70">
                      Simplified track stored with this trip.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-line p-3 text-[11px] text-muted">
                    No GPS track stored for this trip.
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(selectedTrip.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete trip
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
