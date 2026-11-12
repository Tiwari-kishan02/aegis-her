import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

function getPhoneLinks(phone, message) {
  const phoneWithFormatting = phone.trim().replace(/[^\d+]/g, '')
  const digits = phoneWithFormatting.replace(/\D/g, '')
  const whatsappNumber = digits.length === 10 ? `91${digits}` : digits
  const smsNumber = phoneWithFormatting.startsWith('+')
    ? phoneWithFormatting
    : digits.length === 10
      ? `+91${digits}`
      : `+${digits}`
  const encodedMessage = encodeURIComponent(message)

  return {
    whatsapp: `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
    sms: `sms:${smsNumber}?body=${encodedMessage}`,
  }
}

function ShareButton({ href, label, className, newTab = false }) {
  if (!href) {
    return (
      <button type="button" disabled className={`${className} disabled:bg-slate-300 disabled:text-slate-500`}>
        {label}
      </button>
    )
  }

  return (
    <a
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      className={className}
    >
      {label}
    </a>
  )
}

export default function TrustedContactShare({ alert }) {
  const [contacts, setContacts] = useState([])
  const [contactStatus, setContactStatus] = useState('loading')
  const [contactError, setContactError] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')

  useEffect(() => {
    let active = true

    api('/contacts')
      .then((loadedContacts) => {
        if (!active) return
        setContacts(loadedContacts)
        setContactStatus('ready')
      })
      .catch((error) => {
        if (!active) return
        setContactError(error.message)
        setContactStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  const selectedContact = contacts.length === 1
    ? contacts[0]
    : contacts.find((contact) => contact.id === selectedContactId)

  const message = [
    `Alert type: ${alert.type}`,
    `Category: ${alert.category}`,
    `Location: https://maps.google.com/?q=${alert.lat},${alert.lng}`,
    ...(alert.type === 'cab'
      ? [
          `Driver name: ${alert.details?.driverName || 'Not provided'}`,
          `Vehicle number: ${alert.details?.vehicleNumber || 'Not provided'}`,
        ]
      : []),
  ].join('\n')

  const phoneLinks = selectedContact
    ? getPhoneLinks(selectedContact.phone, message)
    : null

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-left">
      <h2 className="text-sm font-bold text-aegis">Share alert with trusted contacts</h2>
      {contactStatus === 'loading' && (
        <p className="mt-2 text-sm text-slate-600">Loading trusted contacts...</p>
      )}
      {contactStatus === 'error' && (
        <p className="mt-2 text-sm text-sos">
          Could not load trusted contacts: {contactError}{' '}
          <Link to="/contacts" className="font-semibold underline">Manage contacts</Link>
        </p>
      )}
      {contactStatus === 'ready' && contacts.length === 0 && (
        <p className="mt-2 text-sm text-slate-600">
          No trusted contacts saved.{' '}
          <Link to="/contacts" className="font-semibold text-aegis underline">Add a contact</Link>
        </p>
      )}
      {contactStatus === 'ready' && contacts.length > 1 && (
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Choose a trusted contact
          <select
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
          >
            <option value="">Select a contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} — {contact.phone}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ShareButton
          href={phoneLinks?.whatsapp}
          label="Share via WhatsApp"
          newTab
          className="grid min-h-11 place-items-center rounded-lg bg-emerald-600 px-2 text-center text-sm font-bold text-white"
        />
        <ShareButton
          href={phoneLinks?.sms}
          label="Share via SMS"
          className="grid min-h-11 place-items-center rounded-lg bg-aegis px-2 text-center text-sm font-bold text-white"
        />
      </div>
    </section>
  )
}
