import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const BASE_URL = "http://10.83.4.146:5001";
const DEVICE_ID = 'brush_01'
const LOW_PRESSURE_THRESHOLD = 100
const HIGH_PRESSURE_THRESHOLD = 350
const quadrantMap = {
  1: 'Top Left',
  2: 'Top Right',
  3: 'Bottom Left',
  4: 'Bottom Right',
}

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

const getPressureMessage = (type) => {
  if (type === 'HIGH') return 'Too much pressure'
  if (type === 'LOW') return 'Apply more pressure'
  return 'Good pressure'
}

const createEmptyQuadrantData = () => ({
  1: [],
  2: [],
  3: [],
  4: [],
})

function App() {
  const [latestData, setLatestData] = useState(null)
  const [summary, setSummary] = useState({ totalSessions: 0, lastPressure: null })
  const [logs, setLogs] = useState([])
  const [quadrant, setQuadrant] = useState(1)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [pressureType, setPressureType] = useState('')
  const [quadrantData, setQuadrantData] = useState(() => {
    try {
      const saved = localStorage.getItem('quadrantData')
      if (!saved) return createEmptyQuadrantData()

      const parsed = JSON.parse(saved)
      const next = createEmptyQuadrantData()

      for (const key of [1, 2, 3, 4]) {
        const raw = parsed?.[key] ?? parsed?.[String(key)]
        const values = Array.isArray(raw) ? raw.map(Number).filter(Number.isFinite) : []
        next[key] = values.slice(-30)
      }

      return next
    } catch {
      return createEmptyQuadrantData()
    }
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCommand, setSendingCommand] = useState('')
  const [mode, setMode] = useState('NORMAL')

  const previousElapsedTimeRef = useRef(0)

  const connectivity = useMemo(() => {
    if (!latestData?.timestamp) {
      return 'OFFLINE'
    }

    const updatedAt = new Date(latestData.timestamp).getTime()
    const now = Date.now()
    return now - updatedAt > 10_000 ? 'OFFLINE' : 'ONLINE'
  }, [latestData])

  useEffect(() => {
    try {
      localStorage.setItem('quadrantData', JSON.stringify(quadrantData))
    } catch {
      // Ignore localStorage failures (private mode, quota, etc.)
    }
  }, [quadrantData])

  async function fetchLatestData() {
    try {
      const response = await fetch(`${BASE_URL}/api/device-data/latest`)
      if (!response.ok) {
        return
      }

      const latest = await response.json()
      const nextPressure = Number(latest?.pressure)
      const nextQuadrant = Number(latest?.quadrant || 1)
      const nextElapsedTime = Number(latest?.elapsedTime || 0)
      const safeQuadrant = [1, 2, 3, 4].includes(nextQuadrant) ? nextQuadrant : 1
      const shouldReset =
        Number.isFinite(nextElapsedTime) && Number.isFinite(previousElapsedTimeRef.current)
          ? nextElapsedTime < previousElapsedTimeRef.current
          : false

      if (Number.isFinite(nextElapsedTime)) {
        previousElapsedTimeRef.current = nextElapsedTime
      }

      setLatestData(latest)
      setQuadrant(safeQuadrant)
      setElapsedTime(Number.isFinite(nextElapsedTime) ? nextElapsedTime : 0)
      setPressureType(String(latest?.pressureType || '').toUpperCase())

      setQuadrantData((prev) => {
        const base = shouldReset ? createEmptyQuadrantData() : prev

        if (!Number.isFinite(nextPressure)) {
          return base
        }

        const updated = { ...base }
        const arr = [...(updated[safeQuadrant] || []), nextPressure]
        if (arr.length > 30) {
          arr.splice(0, arr.length - 30)
        }
        updated[safeQuadrant] = arr

        return updated
      })
      setError('')
    } catch (err) {
      console.error('fetchLatestData failed:', err)
      setError('Could not connect to backend. Check BASE_URL and backend status.')
    }
  }

  async function fetchLogs() {
    try {
      const response = await fetch(`${BASE_URL}/api/logs`)
      if (!response.ok) {
        return
      }

      const logsData = await response.json()
      setLogs(logsData.logs || [])
      setError('')
    } catch (err) {
      console.error('fetchLogs failed:', err)
      setError('Could not connect to backend. Check BASE_URL and backend status.')
    }
  }

  async function fetchSummary() {
    try {
      const response = await fetch(`${BASE_URL}/api/summary`)
      if (!response.ok) {
        return
      }

      const summaryData = await response.json()
      setSummary(summaryData)
      setError('')
    } catch (err) {
      console.error('fetchSummary failed:', err)
      setError('Could not connect to backend. Check BASE_URL and backend status.')
    }
  }

  useEffect(() => {
    let isMounted = true

    async function initialLoad() {
      setLoading(true)
      await Promise.all([fetchLatestData(), fetchLogs(), fetchSummary()])
      if (isMounted) {
        setLoading(false)
      }
    }

    initialLoad()
    const intervalId = setInterval(fetchLatestData, 1000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLogs()
      fetchSummary()
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  async function sendCommand(command) {
    try {
      setSendingCommand(command)
      const response = await fetch(`${BASE_URL}/api/device-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: DEVICE_ID,
          command,
        }),
      })

      if (!response.ok) {
        throw new Error('Command request failed.')
      }

      await fetchLatestData()
    } catch {
      setError('Failed to send command. Check backend status and try again.')
    } finally {
      setSendingCommand('')
    }
  }

  function handleStart() {
    return sendCommand('START')
  }

  function handleStop() {
    return sendCommand('STOP')
  }

  async function generateMockData() {
    try {
      const response = await fetch(`${BASE_URL}/api/mock-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: DEVICE_ID,
        }),
      })

      if (!response.ok) {
        throw new Error('Mock generation failed.')
      }

      await Promise.all([fetchLatestData(), fetchLogs(), fetchSummary()])
    } catch {
      setError('Failed to generate mock data.')
    }
  }

  function prettyTimestamp(timestamp) {
    if (!timestamp) {
      return 'No data yet'
    }

    return new Date(timestamp).toLocaleString()
  }

  function relativeStatusLabel() {
    if (!latestData?.status) {
      return 'OFF'
    }

    return latestData.status === 'ON' ? 'OPERATIONAL' : 'OFF'
  }

  const pressure = latestData?.pressure ?? 0
  const pressureFill = Math.max(0, Math.min(100, Math.round((pressure / HIGH_PRESSURE_THRESHOLD) * 100)))
  const energyPercent = Math.max(
    0,
    Math.min(100, 100 - Math.round((pressure / HIGH_PRESSURE_THRESHOLD) * 45)),
  )
  const guidanceProgress = Math.max(0, Math.min(100, Math.round((elapsedTime / 120) * 100)))
  const displayedLogs = logs.slice(0, 10)

  const currentQuadrant = [1, 2, 3, 4].includes(quadrant) ? quadrant : 1
  const graphData = useMemo(() => {
    const values = quadrantData[currentQuadrant] || []
    return values.map((value, index) => ({
      time: index + 1,
      value,
    }))
  }, [quadrantData, currentQuadrant])

  const averageQuadrantPressure = useMemo(() => {
    const values = quadrantData[currentQuadrant] || []
    if (!values.length) return null
    const total = values.reduce((sum, value) => sum + value, 0)
    return Math.round(total / values.length)
  }, [quadrantData, currentQuadrant])

  return (
    <main className="page-shell">
      <div className="dashboard-shell">
        <section className="top-header">
          <div>
            <h1 className="title">System Dashboard</h1>
            <p className="subtitle">Real-time oversight of Unit A-42 Control Interface</p>
          </div>

          <div className="system-badge card-shell">
            <div className="online-pill">
              <span className={`status-dot ${connectivity === 'ONLINE' ? 'dot-online' : ''}`} />
              <span>{connectivity}</span>
            </div>
            <div className="divider" />
            <p className="status-line">
              <span>SYSTEM STATUS:</span>
              <strong>{relativeStatusLabel()}</strong>
            </p>
          </div>
        </section>

        {error && <p className="error-banner">{error}</p>}

        <section className="main-grid">
          <article className="card-shell panel pressure-panel">
            <div className="panel-head">
              <div>
                <p className="panel-label">System Pressure</p>
                <p className="metric-main">
                  {latestData?.pressure ?? '--'} <small>kPa</small>
                </p>
              </div>
              <span className="icon-fake">⟷</span>
            </div>

            <div className="pressure-bar-bg">
              <div className="pressure-bar-fill" style={{ width: `${pressureFill}%` }} />
              <div className="pressure-bar-critical" />
            </div>

            <div className="pressure-meta">
              <span>MIN: {LOW_PRESSURE_THRESHOLD}</span>
              <span>NORMAL</span>
              <span className="critical">CRITICAL: {HIGH_PRESSURE_THRESHOLD}+</span>
            </div>
          </article>

          <article className="card-shell panel energy-panel">
            <div className="panel-head">
              <div>
                <p className="panel-label">Energy Reserves</p>
                <p className="metric-main metric-green">
                  {energyPercent} <small>%</small>
                </p>
              </div>
              <span className="icon-fake">⚡</span>
            </div>

            <div className="energy-bars">
              {[22, 26, 30, 34, 36].map((h, index) => (
                <span
                  key={h}
                  className={`energy-segment ${index === 4 && energyPercent < 90 ? 'energy-empty' : ''}`}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <p className="energy-note">Estimated Discharge: {Math.max(1, Math.round(energyPercent / 18))}h</p>
          </article>

          <article className="card-shell panel usage-panel">
            <p className="panel-label">Usage Summary</p>
            <div className="usage-grid">
              <div className="usage-box">
                <span>Device ID</span>
                <strong>{latestData?.deviceId || DEVICE_ID}</strong>
              </div>
              <div className="usage-box">
                <span>Status</span>
                <strong>{latestData?.status || 'OFF'}</strong>
              </div>
              <div className="usage-box">
                <span>Cycles</span>
                <strong>{summary.totalSessions}</strong>
              </div>
              <div className="usage-box">
                <span>Last Pressure</span>
                <strong>{summary.lastPressure ?? '--'} kPa</strong>
              </div>
            </div>
          </article>

          <article className="card-shell panel usage-panel">
            <p className="panel-label">Brushing Guidance</p>
            <div className="usage-grid">
              <div className="usage-box">
                <span>Time</span>
                <strong>{formatTime(elapsedTime)}</strong>
              </div>
              <div className="usage-box">
                <span>Quadrant</span>
                <strong>{quadrantMap[quadrant] || quadrantMap[1]}</strong>
              </div>
              <div className="usage-box">
                <span>Pressure</span>
                <strong>{getPressureMessage(pressureType)}</strong>
              </div>
              <div className="usage-box">
                <span>Progress</span>
                <strong>{guidanceProgress}%</strong>
              </div>
            </div>

            <div className="pressure-bar-bg" style={{ marginTop: '16px' }}>
              <div className="pressure-bar-fill" style={{ width: `${guidanceProgress}%` }} />
            </div>
          </article>

          <article className="card-shell panel controls-panel">
            <div className="controls-head">
              <div>
                <h2>Command Controls</h2>
                <p>Unit Authorization Required</p>
              </div>
              <div className="armed-tag">
                <span>DEVICE ARMED</span>
              </div>
            </div>

            <div className="controls-grid">
              <div>
                <p className="panel-label">Primary State</p>
                <div className="primary-buttons">
                  <button
                    type="button"
                    className="btn-start"
                    onClick={handleStart}
                    disabled={sendingCommand === 'START'}
                  >
                    {sendingCommand === 'START' ? 'Sending...' : 'Start Cycle'}
                  </button>
                  <button
                    type="button"
                    className="btn-stop"
                    onClick={handleStop}
                    disabled={sendingCommand === 'STOP'}
                  >
                    {sendingCommand === 'STOP' ? 'Sending...' : 'Stop Unit'}
                  </button>
                </div>
              </div>

              <div>
                <p className="panel-label">Operational Mode</p>
                <div className="mode-switch">
                  {['NORMAL', 'SOFT', 'STRONG'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`mode-btn ${mode === option ? 'mode-active' : ''}`}
                      onClick={() => setMode(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <button type="button" className="mock-btn" onClick={generateMockData}>
                  Generate Mock Data
                </button>
              </div>
            </div>
          </article>

          <article className="card-shell panel controls-panel">
            <div className="controls-head">
              <div>
                <h2>Quadrant Pressure Analysis</h2>
                <p>
                  Current Quadrant: <strong>{quadrantMap[currentQuadrant] || quadrantMap[1]}</strong>
                </p>
              </div>
              <div className="armed-tag">
                <span>AVG {averageQuadrantPressure ?? '--'} kPa</span>
              </div>
            </div>

            {graphData.length === 0 ? (
              <p className="loading-note">Waiting for pressure samples…</p>
            ) : (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--outline)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      stroke="var(--outline)"
                      interval={4}
                      tick={{ fill: 'var(--on-surface-soft)', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--outline)"
                      width={36}
                      tick={{ fill: 'var(--on-surface-soft)', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--secondary)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="card-shell panel alerts-panel">
            <div className="alerts-head">
              <h3>System Alerts</h3>
              <span>Live Feed</span>
            </div>

            {loading ? (
              <p className="loading-note">Loading...</p>
            ) : (
              <ul className="alerts-list">
                {displayedLogs.map((item, index) => (
                  <li key={`${item.timestamp}-${item.message}`} className={`alert-row alert-${index % 3}`}>
                    <div>
                      <p className="alert-title">{item.message}</p>
                      <p className="alert-sub">Updated {new Date(item.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </li>
                ))}
                {displayedLogs.length === 0 && (
                  <li className="alert-row alert-2">
                    <div>
                      <p className="alert-title">No activity yet</p>
                      <p className="alert-sub">Logs will appear here after device updates.</p>
                    </div>
                  </li>
                )}
              </ul>
            )}

            <p className="alerts-foot">Last update: {prettyTimestamp(latestData?.timestamp)}</p>
          </article>

          {/* <article className="card-shell panel telemetry-panel">
            <div className="telemetry-overlay" />
            <p className="telemetry-caption">Telemetry Visualizer</p>
            <h4>Neural Load Balancer</h4>
          </article> */}
        </section>
      </div>
    </main>
  )
}

export default App
