import React, { useEffect, useMemo, useState } from 'react'
import styles from './../css/dashboard.module.css'
import { getStockSnapshot, searchSymbols } from '../api/finnhub'
import AnalystPieChart from '../components/AnalystPieChart'
import PriceVolumeChart from '../components/PriceVolumeChart'

const DEFAULT_SYMBOL = 'AAPL'

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', options).format(value)
}

const formatCurrency = (value) =>
  formatNumber(value, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const formatPercent = (value) =>
  formatNumber(value, { style: 'percent', maximumFractionDigits: 2 })

const Dashboard = () => {
  const [searchValue, setSearchValue] = useState(DEFAULT_SYMBOL)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL)
  const [snapshot, setSnapshot] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSymbol = async (symbol, options = {}) => {
    const { closeSuggestions = true } = options
    const normalizedSymbol = symbol.trim().toUpperCase()
    if (!normalizedSymbol) return

    setSelectedSymbol(normalizedSymbol)
    setIsLoading(true)
    setError('')

    try {
      const data = await getStockSnapshot(normalizedSymbol)
      setSnapshot(data)
      setSearchValue(normalizedSymbol)
      setSuggestions([])
      if (closeSuggestions) {
        setShowSuggestions(false)
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load stock data right now.')
      setSnapshot(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSymbol(DEFAULT_SYMBOL)
  }, [])

  useEffect(() => {
    if (!showSuggestions) return

    const term = searchValue.trim()
    if (!term || term.length < 1) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const results = await searchSymbols(term)
        const topMatches = results
          .filter((item) => item.type === 'Common Stock' || item.type === 'ADR')
          .slice(0, 8)
        setSuggestions(topMatches)
      } catch {
        setSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchValue, showSuggestions])

  const quoteCards = useMemo(() => {
    if (!snapshot?.quote) return []

    const { quote } = snapshot
    return [
      { label: 'Current Price', value: formatCurrency(quote.c) },
      { label: 'Change', value: formatCurrency(quote.d), positive: Number(quote.d) < 0 ? false : true },
      {
        label: 'Change %',
        value: quote.dp === null || quote.dp === undefined ? '-' : formatPercent(quote.dp / 100),
        positive: Number(quote.d) < 0 ? false : true
      },
      { label: 'Day High', value: formatCurrency(quote.h) },
      { label: 'Day Low', value: formatCurrency(quote.l) },
      { label: 'Open', value: formatCurrency(quote.o) },
      { label: 'Previous Close', value: formatCurrency(quote.pc) },
    ]
  }, [snapshot])

  const metricCards = useMemo(() => {
    const metric = snapshot?.metrics ?? {}
    const profile = snapshot?.profile ?? {}
    const marketCap =
      profile.marketCapitalization === null || profile.marketCapitalization === undefined
        ? '-'
        : `${formatNumber(profile.marketCapitalization, { maximumFractionDigits: 0 })} M`

    return [
      { label: 'Market Cap', value: marketCap },
      { label: 'P/E (TTM)', value: formatNumber(metric.peTTM, { maximumFractionDigits: 2 }) },
      { label: 'EPS (TTM)', value: formatNumber(metric.epsTTM, { maximumFractionDigits: 2 }) },
      { label: 'P/B', value: formatNumber(metric.pbAnnual, { maximumFractionDigits: 2 }) },
      { label: '52W High', value: formatCurrency(metric['52WeekHigh']) },
      { label: '52W Low', value: formatCurrency(metric['52WeekLow']) },
      { label: 'Beta', value: formatNumber(metric.beta, { maximumFractionDigits: 2 }) },
      {
        label: 'Dividend Yield',
        value:
          metric.dividendYieldIndicatedAnnual === null ||
          metric.dividendYieldIndicatedAnnual === undefined
            ? '-'
            : formatPercent(metric.dividendYieldIndicatedAnnual / 100),
      },
    ]
  }, [snapshot])

  const analystChart = useMemo(() => {
    const recommendation = snapshot?.recommendations
    if (!recommendation) {
      return { hasData: false, period: '', slices: [], total: 0 }
    }

    const slices = [
      { label: 'Strong Buy', key: 'strongBuy', color: '#198754' },
      { label: 'Buy', key: 'buy', color: '#20c997' },
      { label: 'Hold', key: 'hold', color: '#6c757d' },
      { label: 'Sell', key: 'sell', color: '#fd7e14' },
      { label: 'Strong Sell', key: 'strongSell', color: '#dc3545' },
    ]
      .map((item) => ({
        ...item,
        value: Number(recommendation[item.key] ?? 0),
      }))
      .filter((item) => item.value > 0)

    const total = slices.reduce((sum, item) => sum + item.value, 0)

    if (total === 0) {
      return { hasData: false, period: recommendation.period ?? '', slices: [], total: 0 }
    }

    return {
      hasData: true,
      period: recommendation.period ?? '',
      slices,
      total,
    }
  }, [snapshot])

  return (
    <div className={`container-fluid py-4 ${styles.dashboardContainer}`}>
      <div className="alert alert-warning text-center">
        We can only search for stocks from the USA or UK due to API limitations
      </div>
      <div className={`card shadow-sm ${styles.searchCard}`}>
        <div className="card-body">
          <h5 className="card-title mb-3">Stock Search</h5>
          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault()
              loadSymbol(searchValue)
            }}
          >
            <input
              className="form-control"
              placeholder="Search by symbol or company name (e.g., AAPL, Tesla)"
              value={searchValue}
              onFocus={() => setShowSuggestions(true)}
              onChange={(event) => {
                setSearchValue(event.target.value)
                setShowSuggestions(true)
              }}
              aria-label="Stock search input"
            />
            <button className="btn btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Loading</span>
                </span>
              ) : (
                'Load'
              )}
            </button>
          </form>

          {showSuggestions && suggestionsLoading && (
            <div className={`list-group list-group-item list-group-item-action d-flex justify-content-center pl-5 ${styles.suggestions}`} style={{ minHeight: '25px' }}>
              <div className="spinner-border pl-5 spinner-border-sm text-primary ml-2" role="status" aria-label="Searching symbols">
                <span className="visually-hidden">Searching symbols...</span>
              </div>
            </div>
          )}

          {showSuggestions && (suggestions.length > 0) && !suggestionsLoading && (
            <div className={`list-group mt-1 ${styles.suggestions}`}>
              {suggestions.map((item) => (
                <button
                  type="button"
                  className="list-group-item list-group-item-action"
                  key={`${item.symbol}-${item.description}`}
                  onClick={() => loadSymbol(item.symbol, { closeSuggestions: true })}
                >
                  <strong>{item.symbol}</strong> - {item.description}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h4 className="mb-0">Symbol: {selectedSymbol}</h4>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {snapshot && (
        <>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Company</h5>
              <div className={`row g-3 ${styles.companyGrid}`}>
                <div className="col-md-3">
                  <div className={styles.label}>Name</div>
                  <div>{snapshot.profile.name || '-'}</div>
                </div>
                <div className="col-md-3">
                  <div className={styles.label}>Industry</div>
                  <div>{snapshot.profile.finnhubIndustry || '-'}</div>
                </div>
                <div className="col-md-2">
                  <div className={styles.label}>Country</div>
                  <div>{snapshot.profile.country || '-'}</div>
                </div>
                <div className="col-md-2">
                  <div className={styles.label}>Exchange</div>
                  <div>{snapshot.profile.exchange || '-'}</div>
                </div>
                <div className="col-md-2">
                  <div className={styles.label}>IPO</div>
                  <div>{snapshot.profile.ipo || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <PriceVolumeChart symbol={selectedSymbol} className="mb-4" />

          <section className="mb-4 mt-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Analyst Recommendations</h5>
                {!analystChart.hasData && (
                  <p className="text-muted mb-0">
                    Recommendation trend data is not available for this symbol right now.
                  </p>
                )}

                {analystChart.hasData && (
                  <div className={styles.analystLayout}>
                    <AnalystPieChart
                      className={styles.pieChart}
                      slices={analystChart.slices}
                      total={analystChart.total}
                      symbol={selectedSymbol}
                    />
                    <div className={styles.analystLegend}>
                      <p className="text-muted mb-2">
                        Latest period: <strong>{analystChart.period || '-'}</strong>
                      </p>
                      {analystChart.slices.map((slice) => (
                        <div key={slice.label} className={styles.legendRow}>
                          <span
                            className={styles.legendSwatch}
                            style={{ backgroundColor: slice.color }}
                            aria-hidden="true"
                          />
                          <span className={styles.legendLabel}>{slice.label}</span>
                          <span className={styles.legendValue}>
                            {slice.value} ({formatPercent(slice.value / analystChart.total)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h5 className="mb-3">Price Snapshot</h5>
            <div className="row g-3">
              {quoteCards.map((item) => {
                if (item.label === 'Change' || item.label === 'Change %') {
                  return (
                    <div className="col-sm-6 col-xl-3" key={item.label}>
                      <div className={`card h-100 shadow-sm ${styles.metricCard}`}>
                        <div className="card-body">
                          <div className={styles.label}>{item.label}</div>
                          <div className={`${item.positive ? 'text-success' : 'text-danger'} ${styles.metricValue}`}>
                            { item.value }
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                return (
                <div className="col-sm-6 col-xl-3" key={item.label}>
                  <div className={`card h-100 shadow-sm ${styles.metricCard}`}>
                    <div className="card-body">
                      <div className={styles.label}>{item.label}</div>
                      { (item.label === 'Day High') || (item.label === 'Day Low') ? 
                      (<div className={`${item.label==='Day High' ? 'text-success' : 'text-danger'} ${styles.metricValue}`}>
                        {item.value}
                      </div>) : 
                      (<div className={styles.metricValue}>{item.value}</div>) }
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </section>

          <section>
            <h5 className="mb-3">Fundamentals</h5>
            <div className="row g-3">
              {metricCards.map((item) => (
                <div className="col-sm-6 col-xl-3" key={item.label}>
                  <div className={`card h-100 shadow-sm ${styles.metricCard}`}>
                    <div className="card-body">
                      <div className={styles.label}>{item.label}</div>
                      { (item.label === '52W High' || item.label === '52W Low') ?
                      (<div className={`${item.label==='52W High' ? 'text-success' : 'text-danger'} ${styles.metricValue}`}>
                        {item.value}
                      </div>) : 
                      (<div className={styles.metricValue}>{item.value}</div>) }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </>
      )}
    </div>
  )
}

export default Dashboard
