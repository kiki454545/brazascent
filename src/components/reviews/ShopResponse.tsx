interface ShopResponseProps {
  response: string
  respondedAt?: string | null
}

export function ShopResponse({ response, respondedAt }: ShopResponseProps) {
  return (
    <div className="mt-4 pl-4 border-l-2 border-primary bg-cream/40 dark:bg-white/[0.03] p-4">
      <p className="text-xs font-medium tracking-[0.1em] uppercase text-primary mb-1.5">
        Réponse de Braza Scent
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{response}</p>
      {respondedAt && (
        <time className="block mt-2 text-xs text-muted-foreground/70">
          {new Date(respondedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </time>
      )}
    </div>
  )
}
