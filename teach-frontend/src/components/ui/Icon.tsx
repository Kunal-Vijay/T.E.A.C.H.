import type { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
  strokeWidth?: number
}

export default function Icon({
  icon: IconComponent,
  size = 18,
  className,
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  )
}
