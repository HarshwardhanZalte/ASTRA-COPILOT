import { useState, useEffect, useRef, useCallback } from 'react'
import { telemetryApi } from '../services/api'

export function useTelemetry(maxHistory = 120) {
  const [telemetry, setTelemetry] = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [faultInjectedAt, setFaultInjectedAt] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('Telemetry WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setTelemetry(previous => (
          !previous || data.timestamp >= previous.timestamp ? data : previous
        ))
        setHistory(prev => {
          const next = [...prev, data]
            .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
          return next.slice(-maxHistory).map((sample, index) => ({
            ...sample,
            _idx: index,
          }))
        })
      } catch (e) {
        console.error('Telemetry parse error:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [maxHistory])

  useEffect(() => {
    let active = true
    telemetryApi.getHistory(maxHistory)
      .then((response) => {
        if (active) {
          const initialHistory = response.data || []
          setHistory(initialHistory)
          if (initialHistory.length > 0) {
            setTelemetry(initialHistory[initialHistory.length - 1])
          }
        }
      })
      .catch((error) => {
        console.error('Unable to load telemetry history:', error)
      })
      .finally(() => {
        if (active) connect()
      })

    return () => {
      active = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect, maxHistory])

  const markFaultInjection = useCallback(() => {
    setFaultInjectedAt(history.length)
  }, [history.length])

  return { telemetry, history, connected, faultInjectedAt, markFaultInjection }
}
