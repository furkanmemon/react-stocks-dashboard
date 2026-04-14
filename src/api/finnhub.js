import axios from 'axios'

const BASE_URL = 'https://finnhub.io/api/v1'

const getApiKey = () => {
  const key = import.meta.env.VITE_FINNHUB_API_KEY

  if (!key) {
    throw new Error(
      'Missing Finnhub API key. Add VITE_FINNHUB_API_KEY to your .env.local file.',
    )
  }

  return key
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

const request = async (endpoint, params = {}) => {
  try {
    const response = await client.get(endpoint, {
      params: {
        ...params,
        token: getApiKey(),
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status) {
        throw new Error(`Finnhub request failed with status ${status}.`)
      }

      throw new Error('Finnhub request failed. Please check your network connection and try again.')
    }

    throw error
  }
}

export const searchSymbols = async (query) => {
  const data = await request('/search', { q: query })
  return data.result ?? []
}

export const getQuote = (symbol) => request('/quote', { symbol })

export const getProfile = (symbol) => request('/stock/profile2', { symbol })

export const getBasicFinancials = async (symbol) => {
  const data = await request('/stock/metric', { symbol, metric: 'all' })
  return data.metric ?? {}
}

export const getAnalystRecommendations = async (symbol) => {
  const data = await request('/stock/recommendation', { symbol })

  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  return data.reduce((latest, current) => {
    if (!latest) return current
    return (current.period ?? '') > (latest.period ?? '') ? current : latest
  }, null)
}

export const getStockSnapshot = async (symbol) => {
  const [quote, profile, metrics, recommendations] = await Promise.all([
    getQuote(symbol),
    getProfile(symbol),
    getBasicFinancials(symbol),
    getAnalystRecommendations(symbol),
  ])

  return { quote, profile, metrics, recommendations }
}
