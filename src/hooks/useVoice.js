import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'aegis_voice_language'

export default function useVoice(initialLanguage = 'hi-IN') {
  const [supported, setSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  })
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved || initialLanguage
  })
  const recognitionRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = language

    recognition.onstart = () => {
      setListening(true)
      setError('')
      setTranscript('')
    }

    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => (result[0] ? result[0].transcript : ''))
        .join(' ')
        .trim()

      if (nextTranscript) {
        setTranscript(nextTranscript)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission was denied.')
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else {
        setError('Voice input is not available right now.')
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language])

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setSupported(false)
      setError('Speech recognition is not supported in this browser.')
      return
    }

    try {
      recognitionRef.current.lang = language
      recognitionRef.current.start()
    } catch {
      setError('Mic is already listening. Please try again.')
    }
  }, [language])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
  }, [])

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(nextLanguage)
  }, [])

  return {
    listening,
    transcript,
    supported,
    error,
    start,
    stop,
    language,
    setLanguage,
  }
}
