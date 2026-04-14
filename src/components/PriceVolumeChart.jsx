import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
)

const STOCKDATA_API_URL = 'https://api.stockdata.org/v1/data/eod'
const STOCKDATA_API_KEY = import.meta.env.VITE_STOCKDATA_API_KEY
const TRADING_POINTS_TARGET = 30
const LOOKBACK_DAYS = 120

const formatDate = (date) => date.toISOString().slice(0, 10)
const parseApiDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDateLabel = (value) => {
  const parsed = parseApiDate(value)
  if (!parsed) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed)
}

const getHistoryWindow = () => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - LOOKBACK_DAYS)
  return { dateFrom: formatDate(start), dateTo: formatDate(end) }
}

const PriceVolumeChart = ({ symbol, className = '' }) => {
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const currentSymbol = String(symbol ?? '').trim().toUpperCase()
    if (!currentSymbol) {
      setChartData([])
      setError('')
      return
    }
    if (!STOCKDATA_API_KEY) {
      setChartData([])
      setError('Missing StockData API key. Add VITE_STOCKDATA_API_KEY to your .env.local file.')
      return
    }

    const { dateFrom, dateTo } = getHistoryWindow()
    const controller = new AbortController()

    const loadData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await axios.get(STOCKDATA_API_URL, {
          params: {
            api_token: STOCKDATA_API_KEY,
            symbols: currentSymbol,
            interval: 'day',
            sort: 'asc',
            date_from: dateFrom,
            date_to: dateTo,
          },
          signal: controller.signal,
          timeout: 15000,
        })

        const rawItems = Array.isArray(response.data?.data) ? response.data.data : []

        const parsedItems = rawItems
          .map((item) => {
            const payload = item?.data ?? item
            const close = Number(payload?.close)
            const volume = Number(payload?.volume)
            if (!item?.date || Number.isNaN(close) || Number.isNaN(volume)) {
              return null
            }

            return {
              date: item.date,
              close,
              volume,
            }
          })
          .filter(Boolean)

        setChartData(parsedItems.slice(-TRADING_POINTS_TARGET))
      } catch (requestError) {
        if (axios.isCancel(requestError) || requestError?.name === 'CanceledError') {
          return
        }

        setChartData([])
        setError('Unable to load 30-day price and volume data right now.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => controller.abort()
  }, [symbol])

  const chartPayload = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return null
    }

    const labels = chartData.map((item) => formatDateLabel(item.date))
    const rawDates = chartData.map((item) => item.date)
    const readableDates = chartData.map((item) => {
      const parsed = parseApiDate(item.date)
      if (!parsed) return item.date
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(parsed)
    })
    const closes = chartData.map((item) => item.close)
    const volumes = chartData.map((item) => item.volume)
    return { labels, rawDates, readableDates, closes, volumes }
  }, [chartData])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    if (!canvasRef.current || !chartPayload) {
      return
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: chartPayload.labels,
        datasets: [
          {
            type: 'line',
            label: 'Close Price (USD)',
            data: chartPayload.closes,
            yAxisID: 'yPrice',
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.15)',
            borderWidth: 2,
            pointRadius: (context) => (context.chart.width <= 768 ? 0 : 2),
            pointHoverRadius: (context) => (context.chart.width <= 768 ? 3 : 4),
            tension: 0.25,
          },
          {
            type: 'bar',
            label: 'Volume',
            data: chartPayload.volumes,
            yAxisID: 'yVolume',
            backgroundColor: 'rgba(25, 135, 84, 0.35)',
            borderColor: 'rgba(25, 135, 84, 0.7)',
            borderWidth: 1,
            barThickness: 'flex',
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return ''
                const index = items[0].dataIndex
                return chartPayload.readableDates[index] ?? chartPayload.rawDates[index] ?? ''
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 8,
            },
            grid: {
              display: false,
            },
          },
          yPrice: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Price (USD)',
            },
          },
          yVolume: {
            type: 'linear',
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Volume',
            },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [chartPayload])

  return (
    <section className={className}>
      <h5 className="mb-3">30-Day Price & Volume</h5>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading && <p className="text-muted mb-0">Loading 30-day historical data...</p>}
          {!isLoading && error && (
            <div className="alert alert-danger mb-0" role="alert">
              {error}
            </div>
          )}
          {!isLoading && !error && chartPayload && <canvas ref={canvasRef} style={{ height: '340px' }} />}
          {!isLoading && !error && !chartPayload && (
            <p className="text-muted mb-0">No historical data available for this symbol.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default PriceVolumeChart
