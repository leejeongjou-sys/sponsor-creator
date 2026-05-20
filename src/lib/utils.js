export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableStatus = (status) => status >= 500 || status === 408 || status === 429

export const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (i < retries && isRetryableStatus(res.status)) {
        await delay(backoff * Math.pow(2, i))
        continue
      }
      return res
    } catch (e) {
      if (i < retries) { await delay(backoff * Math.pow(2, i)); continue }
      throw e
    }
  }
}
