import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmButtonProps {
  label: ReactNode
  /** Question shown in place of the button before acting. */
  prompt: string
  confirmLabel?: string
  onConfirm: () => void
  variant?: 'ghost' | 'danger' | 'secondary'
  className?: string
}

/** Two-step destructive action: the confirmation lives in the page, never in a browser dialog. */
export function ConfirmButton({ label, prompt, confirmLabel = 'Sí, borrar', onConfirm, variant = 'ghost', className = '' }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return (
      <Button variant={variant} onClick={() => setAsking(true)} className={className}>
        {label}
      </Button>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label={prompt}>
      <span className="text-sm text-brass-300">{prompt}</span>
      <Button
        variant="danger"
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
        autoFocus
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" onClick={() => setAsking(false)}>
        Cancelar
      </Button>
    </span>
  )
}
