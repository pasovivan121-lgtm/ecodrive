import { useCallback, useEffect, useRef, useState } from 'react'
import { haversineKm } from './geo.ts'

export interface RecorderPoint {
  lat: number
  lon: number
  timestamp: number
  accuracy: number
}

export type RecorderStatus = 'idle' | 'recording' | 'error'

export interface RecorderSummary {
  distanceKm: number
  durationSec: number
  averageSpeedKph: number
  pointCount: number
  skippedCount: number
}

/** Reject fixes worse than this accuracy (metres). */
const MAX_ACCURACY_M = 50
/** Reject steps shorter than this (km) as GPS jitter. */
const MIN_STEP_KM = 0.008
/** Reject implied speeds above this (km/h) as noise spikes. */
const MAX_SPEED_KPH = 220

export function useTripRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [points, setPoints] = useState<RecorderPoint[]>([])
  const [distanceKm, setDistanceKm] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const watchId = useRef<number | null>(null)
  const timerId = useRef<number | null>(null)
  const startedAt = useRef<number | null>(null)
  const lastPoint = useRef<RecorderPoint | null>(null)

  const clearResources = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    if (timerId.current !== null) {
      window.clearInterval(timerId.current)
      timerId.current = null
    }
  }, [])

  useEffect(() => clearResources, [clearResources])

  const reset = useCallback(() => {
    setPoints([])
    setDistanceKm(0)
    setDurationSec(0)
    setAccuracy(null)
    setSkippedCount(0)
    setError(null)
    setStatus('idle')
  }, [])

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('This browser does not support geolocation.')
      setStatus('error')
      return
    }
    clearResources()
    setPoints([])
    setDistanceKm(0)
    setDurationSec(0)
    setSkippedCount(0)
    setError(null)
    setStatus('recording')

    startedAt.current = Date.now()
    lastPoint.current = null

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: reportedAccuracy } = position.coords
        const fixAccuracy = Number.isFinite(reportedAccuracy) ? reportedAccuracy : 999
        setAccuracy(fixAccuracy)

        if (fixAccuracy > MAX_ACCURACY_M) {
          setSkippedCount((count) => count + 1)
          return
        }

        const point: RecorderPoint = {
          lat: latitude,
          lon: longitude,
          timestamp: position.timestamp || Date.now(),
          accuracy: fixAccuracy,
        }

        const previous = lastPoint.current
        if (!previous) {
          lastPoint.current = point
          setPoints([point])
          return
        }

        const stepKm = haversineKm([previous.lat, previous.lon], [point.lat, point.lon])
        const hours = (point.timestamp - previous.timestamp) / 3_600_000
        const impliedSpeedKph = hours > 0 ? stepKm / hours : 0

        if (stepKm < MIN_STEP_KM || impliedSpeedKph > MAX_SPEED_KPH) {
          setSkippedCount((count) => count + 1)
          return
        }

        lastPoint.current = point
        setDistanceKm((value) => value + stepKm)
        setPoints((value) => [...value, point].slice(-4000))
      },
      (geoError) => {
        clearResources()
        setStatus('error')
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Enable it in the browser to record a trip.'
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? 'Your position is currently unavailable.'
              : 'Geolocation timed out. Try again in the open.'
        )
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15_000 }
    )

    timerId.current = window.setInterval(() => {
      if (startedAt.current) {
        setDurationSec(Math.round((Date.now() - startedAt.current) / 1000))
      }
    }, 1000)
  }, [clearResources])

  const stop = useCallback((): RecorderSummary => {
    clearResources()
    const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
    startedAt.current = null
    setDurationSec(seconds)
    setStatus('idle')
    return {
      distanceKm,
      durationSec: seconds,
      averageSpeedKph: seconds > 0 ? distanceKm / (seconds / 3600) : 0,
      pointCount: points.length,
      skippedCount,
    }
  }, [clearResources, distanceKm, points.length, skippedCount])

  return {
    status,
    points,
    distanceKm,
    durationSec,
    accuracy,
    skippedCount,
    error,
    start,
    stop,
    reset,
  }
}
