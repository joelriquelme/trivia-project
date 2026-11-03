import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brass-500 text-stage-950 shadow-[0_4px_0_0_#9a6a14] hover:bg-brass-400 active:translate-y-[2px] active:shadow-[0_2px_0_0_#9a6a14]',
  secondary: 'bg-stage-700 text-stage-100 shadow-[0_4px_0_0_#0b1f2a] hover:bg-stage-600 active:translate-y-[2px] active:shadow-[0_2px_0_0_#0b1f2a]',
  ghost: 'bg-transparent text-stage-100 ring-1 ring-stage-600 hover:bg-stage-800',
  danger: 'bg-coral-500 text-white shadow-[0_4px_0_0_#9e2f25] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#9e2f25]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  const sizing = size === 'lg' ? 'px-7 py-3.5 text-lg' : 'px-4 py-2 text-base'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold transition-[transform,background-color,box-shadow,filter] duration-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${sizing} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}
