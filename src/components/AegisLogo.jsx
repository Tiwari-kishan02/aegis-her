export default function AegisLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Aegis">
      <path
        fill="currentColor"
        d="M24 3.5 42 10v11.2c0 11.3-7.3 19.1-18 23.3C13.3 40.3 6 32.5 6 21.2V10L24 3.5Z"
      />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M24 13.1a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8a7.2 7.2 0 0 0-7.2-7.2Zm0 10.3a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
