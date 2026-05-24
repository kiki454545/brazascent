interface PaymentLogosProps {
  className?: string
}

export function PaymentLogos({ className = '' }: PaymentLogosProps) {
  const card = 'h-7 flex items-center justify-center bg-white border border-gray-200 rounded px-2 shadow-sm select-none'

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>

      {/* Visa */}
      <div className={card} style={{ minWidth: 44 }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontStyle: 'italic', color: '#1A1F71', fontSize: 14, letterSpacing: '-0.5px' }}>
          VISA
        </span>
      </div>

      {/* Mastercard */}
      <div className={card} style={{ minWidth: 44 }}>
        <svg viewBox="0 0 38 24" height="20" style={{ display: 'block' }}>
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="24" cy="12" r="10" fill="#F79E1B" />
          <path d="M19 4.94a10 10 0 0 1 0 14.12A10 10 0 0 1 19 4.94z" fill="#FF5F00" />
        </svg>
      </div>

      {/* CB */}
      <div className={`${card} bg-[#003A8C] border-[#003A8C]`} style={{ minWidth: 44 }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 800, color: 'white', fontSize: 13, letterSpacing: 1 }}>
          CB
        </span>
      </div>

      {/* Amex */}
      <div className={`${card} bg-[#2E77BC] border-[#2E77BC]`} style={{ minWidth: 44 }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, color: 'white', fontSize: 11, letterSpacing: 0.5 }}>
          AMEX
        </span>
      </div>

      {/* Apple Pay */}
      <div className={`${card} bg-black border-black`} style={{ minWidth: 56 }}>
        <svg viewBox="0 0 20 24" height="16" style={{ display: 'block', marginRight: 3 }} fill="white">
          <path d="M13.476 2.143c.743-.895 1.25-2.126 1.107-3.38-1.072.046-2.372.718-3.138 1.612-.69.78-1.298 2.03-1.133 3.23 1.195.09 2.415-.617 3.164-1.462zm.306 1.83c-1.747-.104-3.238 1.003-4.073 1.003-.84 0-2.113-.952-3.494-.925-1.8.026-3.467 1.06-4.394 2.69-1.878 3.29-.494 8.16 1.336 10.836.896 1.317 1.969 2.787 3.376 2.734 1.347-.052 1.857-.882 3.49-.882 1.631 0 2.09.882 3.49.856 1.458-.026 2.378-1.337 3.268-2.657 1.027-1.507 1.452-2.97 1.475-3.042-.03-.013-2.847-1.1-2.873-4.36-.026-2.73 2.2-4.055 2.3-4.127-1.262-1.89-3.21-2.1-3.9-2.127z" />
        </svg>
        <span style={{ fontFamily: '-apple-system, Arial, sans-serif', fontWeight: 500, color: 'white', fontSize: 12 }}>
          Pay
        </span>
      </div>

      {/* Google Pay */}
      <div className={card} style={{ minWidth: 56 }}>
        <svg viewBox="0 0 16 16" height="14" style={{ display: 'block', marginRight: 3 }}>
          <path d="M8 3.5a4.5 4.5 0 0 0-4.5 4.5c0 2.485 2.015 4.5 4.5 4.5S12.5 10.485 12.5 8c0-.28-.026-.553-.075-.818H8V6.364h5.31c.12.52.19 1.06.19 1.636C13.5 11.037 11.037 13.5 8 13.5S2.5 11.037 2.5 8 4.963 2.5 8 2.5c1.296 0 2.482.453 3.404 1.202L10.3 4.81A3.5 3.5 0 0 0 8 3.5z" fill="#4285F4"/>
        </svg>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 500, color: '#3C4043', fontSize: 12 }}>
          Pay
        </span>
      </div>

      {/* Stripe Link */}
      <div className={`${card} bg-[#00D66B] border-[#00D66B]`} style={{ minWidth: 52, gap: 4 }}>
        <svg viewBox="0 0 14 14" height="12" style={{ display: 'block' }} fill="white">
          <path d="M7 1.5a2 2 0 0 1 2 2v.5H9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h.5v.5a2 2 0 0 1-4 0V9.5H6a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-.5V3.5a2 2 0 0 1 2-2zm0-1.5a3.5 3.5 0 0 0-3.5 3.5v.5H3A1.5 1.5 0 0 0 1.5 5v4A1.5 1.5 0 0 0 3 10.5h.5v.5a3.5 3.5 0 0 0 7 0v-.5H11A1.5 1.5 0 0 0 12.5 9V5A1.5 1.5 0 0 0 11 3.5h-.5V3.5A3.5 3.5 0 0 0 7 0z"/>
        </svg>
        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, color: 'white', fontSize: 11 }}>
          Link
        </span>
      </div>

    </div>
  )
}
