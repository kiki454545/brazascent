'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '8px 20px',
        background: '#19110B',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
      }}
    >
      Imprimer / Enregistrer PDF
    </button>
  )
}
