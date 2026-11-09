export default function SuccessScreen({ alert, onBack, type = 'police' }) {
  const isOffline = alert?.offline
  const isTest = alert?.testMode
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 pb-5 pt-5 text-center">
      <div className="mt-12 rounded-lg border border-slate-200 bg-white px-5 py-8 shadow-sm">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${type === 'ambulance' ? 'bg-ambulance' : 'bg-sos'} text-3xl font-bold text-white`}>✓</div>
        <h1 className="mt-5 text-xl font-bold text-aegis">
          {type === 'ambulance'
            ? 'Help alert sent to your trusted contacts. Call 108 now.'
            : isOffline
            ? 'Saved offline, will not notify contacts'
            : 'Complaint registered (saved locally)'}
        </h1>
        <p className="mt-3 text-sm text-slate-600">Alert ID</p>
        <p className="mt-1 break-all font-mono text-xs text-slate-800">{alert?.id}</p>
        {isTest && (
          <div className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
            TEST MODE: no real alert sent
          </div>
        )}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        {type === 'ambulance' ? (
          <>
            <a href="tel:108" className="grid h-12 place-items-center rounded-lg bg-ambulance font-bold text-white">Call 108</a>
            <button type="button" onClick={onBack} className="rounded-lg border border-aegis font-bold text-aegis">
              Back to home
            </button>
          </>
        ) : (
          <>
            <a href="tel:112" className="grid h-12 place-items-center rounded-lg bg-sos font-bold text-white">Call 112</a>
            <button type="button" onClick={onBack} className="rounded-lg border border-aegis font-bold text-aegis">
              Back to home
            </button>
          </>
        )}
      </div>
    </main>
  )
}
