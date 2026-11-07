import { ArrowLeft, Trash2, UserRoundPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../services/api'

export default function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    api('/contacts')
      .then(setContacts)
      .catch((loadError) => setError(loadError.message))
  }, [navigate])

  const addContact = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const contact = await api('/contacts', { method: 'POST', body: JSON.stringify({ name, phone }) })
      setContacts((current) => [...current, contact])
      setName('')
      setPhone('')
    } catch (addError) {
      setError(addError.message)
    }
  }

  const removeContact = async (id) => {
    setError('')
    try {
      await api(`/contacts/${id}`, { method: 'DELETE' })
      setContacts((current) => current.filter((contact) => contact.id !== id))
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 py-4">
      <button type="button" onClick={() => navigate(-1)} className="mb-5 flex h-11 items-center gap-2 font-semibold text-aegis">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
      </button>
      <h1 className="text-2xl font-bold text-aegis">Trusted contacts</h1>

      <form onSubmit={addContact} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <UserRoundPlus className="h-5 w-5 text-aegis" aria-hidden="true" /> Add a contact
        </div>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="mt-3 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" />
        <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit phone" className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" />
        {error && <p className="mt-3 text-sm text-sos">{error}</p>}
        <button type="submit" disabled={!name.trim() || !phone.trim() || contacts.length >= 5} className="mt-3 h-11 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
          Add contact
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
            <div><p className="font-semibold text-slate-800">{contact.name}</p><p className="text-sm text-slate-500">{contact.phone}</p></div>
            <button type="button" aria-label={`Remove ${contact.name}`} onClick={() => removeContact(contact.id)} className="grid h-10 w-10 place-items-center rounded-full text-sos">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
