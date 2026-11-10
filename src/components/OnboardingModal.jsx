import { useState } from 'react'

const slides = [
  {
    title: 'What Aegis does',
    text: 'Aegis helps you alert trusted contacts, request emergency help, and get quick directions when you need support.',
  },
  {
    title: 'Add trusted contacts',
    text: 'Save your trusted contacts so alerts can include your live location and a Google Maps link.',
  },
  {
    title: 'Use the SOS flow',
    text: 'Choose Police, Ambulance, or Safe Cab, confirm your location, and reach the right help quickly.',
  },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('aegis_onboarding_seen') !== 'true'
  })
  const [index, setIndex] = useState(0)

  const next = () => {
    if (index < slides.length - 1) {
      setIndex((current) => current + 1)
      return
    }

    localStorage.setItem('aegis_onboarding_seen', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-aegis">Welcome</p>
          <button type="button" onClick={next} className="text-sm font-semibold text-aegis">Skip</button>
        </div>

        <div className="mt-4 min-h-[150px]">
          <h2 className="text-2xl font-bold text-slate-900">{slides[index].title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{slides[index].text}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((slide, slideIndex) => (
              <span
                key={slide.title}
                className={`h-2.5 w-2.5 rounded-full ${slideIndex === index ? 'bg-aegis' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          <button type="button" onClick={next} className="rounded-lg bg-aegis px-4 py-2 text-sm font-bold text-white">
            {index === slides.length - 1 ? 'Start' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
