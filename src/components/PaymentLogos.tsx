interface PaymentLogosProps {
  className?: string
  iconClassName?: string
}

export function PaymentLogos({ className = '', iconClassName = '' }: PaymentLogosProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Visa */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 60 20" className="h-4 w-auto" aria-label="Visa">
          <text x="0" y="16" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fontStyle="italic" fill="#1A1F71">VISA</text>
        </svg>
      </div>

      {/* Mastercard */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-label="Mastercard">
          <circle cx="13" cy="12" r="10" fill="#EB001B" />
          <circle cx="25" cy="12" r="10" fill="#F79E1B" />
          <path d="M19 4.93a10 10 0 0 1 0 14.14A10 10 0 0 1 19 4.93z" fill="#FF5F00" />
        </svg>
      </div>

      {/* CB (Carte Bleue) */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 40 24" className="h-5 w-auto" aria-label="Carte Bancaire">
          <rect width="40" height="24" rx="3" fill="#004A97" />
          <text x="5" y="17" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="13" fill="white">CB</text>
        </svg>
      </div>

      {/* American Express */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 52 24" className="h-5 w-auto" aria-label="American Express">
          <rect width="52" height="24" rx="3" fill="#2E77BC" />
          <text x="4" y="16" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="9" fill="white">AMERICAN</text>
          <text x="4" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="9" fill="white">EXPRESS</text>
        </svg>
      </div>

      {/* Apple Pay */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 50 24" className="h-5 w-auto" aria-label="Apple Pay">
          <path d="M9.5 6.5c.8-.9 1.3-2.2 1.2-3.5-1.2.1-2.6.8-3.4 1.7-.7.8-1.3 2.1-1.2 3.4 1.3.1 2.6-.6 3.4-1.6z" fill="black"/>
          <path d="M10.7 8.3c-1.9-.1-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1C.8 8.4-.3 9.7 0 11.5c.7 4.1 2.9 8 5.3 8 1.3 0 1.8-.9 3.4-.9 1.6 0 2.1.9 3.4.9 2.4 0 4.6-3.9 5.3-8 .3-1.6-.9-3-1.7-3.2z" fill="black"/>
          <text x="19" y="17" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="11" fill="black">Pay</text>
        </svg>
      </div>

      {/* Google Pay */}
      <div className={`flex items-center justify-center bg-white rounded px-2 py-1 h-8 ${iconClassName}`}>
        <svg viewBox="0 0 48 24" className="h-5 w-auto" aria-label="Google Pay">
          <text x="1" y="17" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="13" fill="#4285F4">G</text>
          <text x="10" y="17" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="13" fill="#5F6368">Pay</text>
        </svg>
      </div>
    </div>
  )
}
