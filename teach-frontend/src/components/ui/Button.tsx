import { forwardRef, memo, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import Icon from './Icon'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'highlight'
  | 'sage'
  | 'danger'
  | 'success'

interface ButtonStyleProps {
  variant?: ButtonVariant
  pill?: boolean
  icon?: LucideIcon
  iconSize?: number
  loading?: boolean
  withIcon?: boolean
  className?: string
}

function buttonClasses({
  variant = 'primary',
  pill = false,
  icon,
  withIcon = false,
  loading = false,
  className,
}: ButtonStyleProps): string {
  return cn(
    'btn',
    `btn-${variant}`,
    pill && 'hub-btn-pill',
    (withIcon || icon != null) && 'btn-with-icon',
    loading && 'is-loading',
    className,
  )
}

export interface ButtonProps
  extends ButtonStyleProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
}

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    pill = false,
    icon,
    iconSize = 16,
    loading = false,
    withIcon = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled === true || loading

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, pill, icon, withIcon, loading, className })}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon != null && !loading ? <Icon icon={icon} size={iconSize} /> : null}
      {children}
    </button>
  )
}))

export interface ButtonLinkProps extends ButtonStyleProps, LinkProps {
  children: ReactNode
}

export const ButtonLink = memo(forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = 'primary',
    pill = false,
    icon,
    iconSize = 16,
    loading = false,
    withIcon = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Link
      ref={ref}
      className={buttonClasses({ variant, pill, icon, withIcon, loading, className })}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon != null ? <Icon icon={icon} size={iconSize} /> : null}
      {children}
    </Link>
  )
}))

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    Pick<ButtonStyleProps, 'className' | 'loading'> {
  icon: LucideIcon
  label: string
  iconSize?: number
  remove?: boolean
}

export const IconButton = memo(forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    iconSize = 16,
    loading = false,
    remove = false,
    className,
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
      className={cn('btn', 'btn-icon', remove && 'btn-icon-remove', loading && 'is-loading', className)}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled === true || loading}
      {...rest}
    >
      <Icon icon={icon} size={iconSize} />
    </button>
  )
}))
