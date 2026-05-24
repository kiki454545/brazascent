interface PaymentLogosProps {
  className?: string
}

export function PaymentLogos({ className = '' }: PaymentLogosProps) {
  const base: React.CSSProperties = {
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    paddingLeft: 8,
    paddingRight: 8,
    boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
    userSelect: 'none',
    minWidth: 44,
    backgroundColor: '#ffffff',
  }

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>

      {/* Visa */}
      <div style={base}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontStyle: 'italic', color: '#1A1F71', fontSize: 14, letterSpacing: '-0.5px' }}>
          VISA
        </span>
      </div>

      {/* Mastercard */}
      <div style={base}>
        <svg viewBox="0 0 38 24" height="20" style={{ display: 'block' }}>
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="24" cy="12" r="10" fill="#F79E1B" />
          <path d="M19 4.94a10 10 0 0 1 0 14.12A10 10 0 0 1 19 4.94z" fill="#FF5F00" />
        </svg>
      </div>

      {/* CB */}
      <div style={{ ...base, backgroundColor: '#003A8C', borderColor: '#003A8C' }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 800, color: '#ffffff', fontSize: 13, letterSpacing: 1 }}>
          CB
        </span>
      </div>

      {/* Amex */}
      <div style={{ ...base, backgroundColor: '#2E77BC', borderColor: '#2E77BC' }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, color: '#ffffff', fontSize: 11, letterSpacing: 0.5 }}>
          AMEX
        </span>
      </div>

      {/* Apple Pay */}
      <div style={{ ...base, backgroundColor: '#000000', borderColor: '#000000', minWidth: 56, gap: 3 }}>
        <svg viewBox="0 0 20 24" height="16" style={{ display: 'block' }} fill="white">
          <path d="M13.476 2.143c.743-.895 1.25-2.126 1.107-3.38-1.072.046-2.372.718-3.138 1.612-.69.78-1.298 2.03-1.133 3.23 1.195.09 2.415-.617 3.164-1.462zm.306 1.83c-1.747-.104-3.238 1.003-4.073 1.003-.84 0-2.113-.952-3.494-.925-1.8.026-3.467 1.06-4.394 2.69-1.878 3.29-.494 8.16 1.336 10.836.896 1.317 1.969 2.787 3.376 2.734 1.347-.052 1.857-.882 3.49-.882 1.631 0 2.09.882 3.49.856 1.458-.026 2.378-1.337 3.268-2.657 1.027-1.507 1.452-2.97 1.475-3.042-.03-.013-2.847-1.1-2.873-4.36-.026-2.73 2.2-4.055 2.3-4.127-1.262-1.89-3.21-2.1-3.9-2.127z" />
        </svg>
        <span style={{ fontFamily: '-apple-system, Arial, sans-serif', fontWeight: 500, color: '#ffffff', fontSize: 12 }}>
          Pay
        </span>
      </div>

      {/* Google Pay */}
      <div style={{ ...base, minWidth: 56, gap: 3 }}>
        <svg viewBox="0 0 24 24" height="14" style={{ display: 'block' }}>
          <path d="M12 5.5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.8 2.4 14.6 1.5 12 1.5 8.3 1.5 5.1 3.7 3.6 7l3.3 2.5C7.6 7.2 9.6 5.5 12 5.5z" fill="#EA4335"/>
          <path d="M22.3 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.8c-.3 1.3-1 2.4-2 3.1l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.1-.1-.1-.1-.3 0-.4z" fill="#4285F4"/>
          <path d="M6.9 14.5c-.3-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L3.6 7c-.7 1.4-1.1 3-1.1 5s.4 3.6 1.1 5l3.3-2.5z" fill="#FBBC05"/>
          <path d="M12 22.5c2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.9.6-2 1-3.3 1-2.4 0-4.4-1.6-5.1-3.8L3.5 17.5C5 20.8 8.3 22.5 12 22.5z" fill="#34A853"/>
        </svg>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 500, color: '#3C4043', fontSize: 12 }}>
          Pay
        </span>
      </div>

      {/* Stripe Link */}
      <div style={{ ...base, backgroundColor: '#00D66B', borderColor: '#00D66B', minWidth: 52, gap: 4 }}>
        <svg viewBox="0 0 16 16" height="12" style={{ display: 'block' }} fill="white">
          <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5v.5H4A1.5 1.5 0 0 0 2.5 6.5v3A1.5 1.5 0 0 0 4 11h.5v.5a3.5 3.5 0 0 0 7 0V11H12a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 12 5h-.5v-.5A3.5 3.5 0 0 0 8 1zm0 1.5A2 2 0 0 1 10 4.5V5H6v-.5A2 2 0 0 1 8 2.5zm0 9a2 2 0 0 1-2-2V11h4v-.5a2 2 0 0 1-2 2z"/>
        </svg>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, color: '#ffffff', fontSize: 11 }}>
          Link
        </span>
      </div>

    </div>
  )
}
