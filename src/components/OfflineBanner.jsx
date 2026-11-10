import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
      <span className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        You are offline. Alerts will be saved locally and retried automatically.
      </span>
    </div>
  )
}
