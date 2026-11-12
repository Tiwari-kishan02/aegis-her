import { Ambulance, CarFront, Shield } from 'lucide-react'
import BlockCard from '../components/BlockCard'
import Header from '../components/Header'

export default function Home() {
  const cards = [
    {
      title: 'Police',
      description: 'Report an incident, call 112',
      icon: Shield,
      color: 'bg-sos',
      to: '/police',
    },
    {
      title: 'Safe Cab',
      description: 'Book a ride home, share details',
      icon: CarFront,
      color: 'bg-cab',
      to: '/cab',
    },
    {
      title: 'Ambulance',
      description: 'Medical emergency, call 108',
      icon: Ambulance,
      color: 'bg-ambulance',
      to: '/ambulance',
    },
  ]

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg">
      <Header />
      <section className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <h1 className="mb-5 text-[28px] font-bold leading-tight text-aegis">
          Where do you need help?
        </h1>
        <div className="flex flex-col gap-4">
          {cards.map((card) => <BlockCard key={card.title} {...card} />)}
        </div>
      </section>
      <footer className="px-5 pb-5 pt-2 text-center text-sm text-slate-600">
        <p className="mb-2">
          Aegis is a demo project and does not contact police directly. In an emergency call 112.
        </p>
        In immediate danger?{' '}
        <a className="font-bold text-sos underline underline-offset-2" href="tel:112">
          Call 112
        </a>
      </footer>
    </main>
  )
}
