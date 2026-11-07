import AegisLogo from './AegisLogo'

export default function Header() {
  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-3">
      <AegisLogo className="h-11 w-11 text-aegis" />
      <div>
        <p className="text-[22px] font-bold leading-tight text-aegis">Aegis</p>
        <p className="text-xs text-slate-500">Her shield, wherever she goes.</p>
      </div>
    </header>
  )
}
