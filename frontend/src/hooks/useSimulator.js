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

  const injectFault = useCallback(async (faultType, severity = 'HIGH') => {
    setLoading(true)
    try {
      const res = await simulatorApi.injectFault(faultType, severity)
      await refreshStatus()
      await refreshEvents()
      return res
    } finally {
      setLoading(false)
    }
  }, [refreshStatus, refreshEvents])

  const clearFault = useCallback(async () => {
    setLoading(true)
    try {
      const res = await simulatorApi.clearFault()
      await refreshStatus()
      await refreshEvents()
      return res
    } finally {
      setLoading(false)
    }
  }, [refreshStatus, refreshEvents])

  const setConditions = useCallback(async (conditions) => {
    const res = await simulatorApi.setConditions(conditions)
    await refreshStatus()
    return res
  }, [refreshStatus])

  return { status, events, loading, start, pause, reset, injectFault, clearFault, setConditions, refreshStatus }
}
