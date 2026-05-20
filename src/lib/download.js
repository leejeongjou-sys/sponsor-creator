// Robust image download for both data: URLs and remote https URLs (e.g. Firebase Storage).
//
// `<a download href="data:...">` is unreliable across browsers for large base64 strings,
// and remote URLs sometimes navigate instead of downloading. Converting to a Blob first
// + objectURL is the most compatible approach.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const downloadUrl = async (url, filename) => {
  if (!url) throw new Error('No URL to download')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoke after a tick so the browser has time to dispatch the download
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
}

// Sequentially trigger downloads. Browsers throttle simultaneous downloads and may
// silently drop ones that fire too fast — a small delay between each keeps things reliable.
export const downloadAll = async (items, baseFilename = 'Sponsor_Creator') => {
  const stamp = Date.now()
  for (let i = 0; i < items.length; i++) {
    const url = items[i]?.url
    if (!url) continue
    try {
      await downloadUrl(url, `${baseFilename}_${stamp}_${i + 1}.jpg`)
      await sleep(250)
    } catch (e) {
      console.warn(`Download ${i + 1} failed:`, e)
    }
  }
}
