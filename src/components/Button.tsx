import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'magenta' | 'danger'
type Size = 'm' | 'l' | 's'

function classes(variant: Variant, size: Size, block: boolean, extra?: string) {
  return ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : '', extra ?? '']
    .filter(Boolean)
    .join(' ')
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  icon?: ReactNode
  iconAfter?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'm',
    block = false,
    loading = false,
    icon,
    iconAfter,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <LoaderCircle className="btn__icon spin" aria-hidden="true" /> : icon}
      <span>{children}</span>
      {iconAfter}
    </button>
  )
})

interface LinkButtonProps extends LinkProps {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
  iconAfter?: ReactNode
}

export function LinkButton({
  variant = 'primary',
  size = 'm',
  block = false,
  icon,
  iconAfter,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={classes(variant, size, block, className)} {...rest}>
      {icon}
      <span>{children}</span>
      {iconAfter}
    </Link>
  )
}
