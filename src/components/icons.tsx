import { CheckCircle, ContrastIcon, Moon, SunMedium } from "lucide-react"
import React from "react"

export type IconKeys = keyof typeof icons

type IconsType = {
  [key in IconKeys]: React.ElementType
}

// Custom modern, clean logo for typostry
const ModernLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="15" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </svg>
)

const icons = {
  logo: ModernLogo,
  sun: SunMedium,
  moon: Moon,
  contrast: ContrastIcon,
  checkCircle: CheckCircle,
}

export const Icons: IconsType = icons
