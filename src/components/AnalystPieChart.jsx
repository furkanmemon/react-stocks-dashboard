import React, { useEffect, useRef } from 'react'
import { ArcElement, Chart, Legend, PieController, Tooltip } from 'chart.js'

Chart.register(PieController, ArcElement, Tooltip, Legend)

const formatPercent = (value) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(value)

const AnalystPieChart = ({ slices, symbol, total, className }) => {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    if (!canvasRef.current || !Array.isArray(slices) || slices.length === 0 || total <= 0) {
      return
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'pie',
      data: {
        labels: slices.map((slice) => slice.label),
        datasets: [
          {
            data: slices.map((slice) => slice.value),
            backgroundColor: slices.map((slice) => slice.color),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw ?? 0)
                const percentage = total > 0 ? value / total : 0
                return `${context.label}: ${value} (${formatPercent(percentage)})`
              },
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
  }, [slices, total])

  return (
    <div className={className}>
      <canvas ref={canvasRef} role="img" aria-label={`Analyst recommendation breakdown for ${symbol}`} />
    </div>
  )
}

export default AnalystPieChart
