import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200/50",
    secondary: "bg-gray-50/80 text-gray-600 border-gray-200/50",
    success: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/50",
    warning: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200/50",
    destructive: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/50",
    outline: "text-gray-700 border-gray-300/50 bg-white/50"
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200",
        "hover:scale-105 hover:shadow-sm",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
