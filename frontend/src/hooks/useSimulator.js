import { useState, useCallback, useEffect } from 'react'
import { simulatorApi } from '../services/api'

export function useSimulator() {
  const [status, setStatus] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const s = await simulatorApi.getStatus()
      setStatus(s)
    } catch {}
  }, [])

  const refreshEvents = useCallback(async () => {
    try {
      const e = await simulatorApi.getEvents()
      setEvents(e.events || [])
    } catch {}
  }, [])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(() => {
      refreshStatus()
      refreshEvents()
    }, 1000)
    return () => clearInterval(interval)
  }, [refreshStatus, refreshEvents])

  const start = useCallback(async () => {
    setLoading(true)
    try { await simulatorApi.start() } finally { setLoading(false) }
    refreshStatus()
  }, [refreshStatus])

  const pause = useCallback(async () => {
    setLoading(true)
    try { await simulatorApi.pause() } finally { setLoading(false) }
    refreshStatus()
  }, [refreshStatus])

  const reset = useCallback(async () => {
    setLoading(true)
    try { await simulatorApi.reset() } finally { setLoading(false) }
    refreshStatus()
  }, [refreshStatus])

  const injectFault = useCallback(async (faultType, severity) => {
    await simulatorApi.injectFault(faultType, severity)
    refreshStatus()
  }, [refreshStatus])

  const clearFault = useCallback(async () => {
    await simulatorApi.clearFault()
    refreshStatus()
  }, [refreshStatus])

  const setConditions = useCallback(async (conditions) => {
    await simulatorApi.setConditions(conditions)
  }, [])

  return { status, events, loading, start, pause, reset, injectFault, clearFault, setConditions, refreshStatus }
}
