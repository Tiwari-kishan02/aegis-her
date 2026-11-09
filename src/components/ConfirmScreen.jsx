import { useState } from 'react'

export default function ConfirmScreen({
  type = 'police',
  incident,
  position,
  onConfirm,
  onBack,
  showPatientDetails = false,
}) {
  const [patientDetails, setPatientDetails] = useState('')
  return (
    <section className="mt-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-aegis">Confirm {type === 'ambulance' ? 'emergency' : 'complaint'}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">{type === 'ambulance' ? 'Emergency' : 'Incident'}</dt>
            <dd className="font-semibold text-slate-800">{incident?.label}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Location</dt>
            <dd className="font-mono text-xs text-slate-700">{position?.lat?.toFixed(5)}, {position?.lng?.toFixed(5)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Accuracy</dt>
            <dd className="text-slate-700">{position?.accuracy ? `${Math.round(position.accuracy)} m` : 'N/A'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Time</dt>
            <dd className="text-slate-700">{new Date().toLocaleString()}</dd>
          </div>
          {showPatientDetails && (
            <div className="flex flex-col gap-1 pt-2">
              <label htmlFor="patient-details" className="text-slate-500 text-xs font-semibold">Patient details (optional)</label>
              <input
                id="patient-details"
                type="text"
                value={patientDetails}
                onChange={e => setPatientDetails(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                placeholder="e.g. Age, known conditions, etc."
              />
            </div>
          )}
        </dl>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-aegis font-bold text-aegis"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onConfirm(patientDetails)}
          className={type === 'ambulance'
            ? 'rounded-lg bg-ambulance font-bold text-white'
            : 'rounded-lg bg-sos font-bold text-white'}
        >
          Confirm
        </button>
      </div>
    </section>
  )
}
