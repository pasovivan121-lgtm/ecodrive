import test from 'node:test'
import assert from 'node:assert/strict'
import { haversineKm, parseCoordinateInput } from './geo.ts'

test('parses "lat, lon" input', () => {
  const place = parseCoordinateInput('42.6984, 23.3261')
  assert.ok(place)
  assert.equal(place?.lat, 42.6984)
  assert.equal(place?.lon, 23.3261)
})

test('accepts whitespace and semicolon separators', () => {
  assert.ok(parseCoordinateInput('  42.7  23.3 '))
  assert.ok(parseCoordinateInput('42.7;23.3'))
})

test('rejects text, out-of-range values and malformed input', () => {
  assert.equal(parseCoordinateInput('Sofia'), null)
  assert.equal(parseCoordinateInput('91, 23'), null)
  assert.equal(parseCoordinateInput('42.7, 181'), null)
  assert.equal(parseCoordinateInput('42.7'), null)
})

test('haversine distance for Sofia to Plovdiv is about 130 km', () => {
  const distance = haversineKm([42.6977, 23.3219], [42.1354, 24.7453])
  assert.ok(distance > 120 && distance < 145, `unexpected distance ${distance}`)
})

test('haversine distance of identical points is zero', () => {
  assert.equal(haversineKm([42.7, 23.3], [42.7, 23.3]), 0)
})
