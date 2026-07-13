import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-[#0066cc] text-white hover:bg-[#0077ed] active:bg-[#005bb5]',
        outline:
          'border border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc]/10 active:bg-[#0066cc]/15',
        secondary:
          'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] active:bg-[#d1d1d6]',
        ghost:
          'bg-transparent text-[#1d1d1f] hover:bg-[#f5f5f7] active:bg-[#e8e8ed] dark:text-white dark:hover:bg-white/10',
        destructive:
          'bg-transparent text-[#ff3b30] hover:bg-[#ff3b30]/10 active:bg-[#ff3b30]/15',
        link: 'text-[#0066cc] underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-11 gap-2 px-5 font-sans text-[15px] leading-none tracking-normal',
        xs: 'h-7 gap-1 rounded-full px-2.5 text-xs font-sans tracking-normal',
        sm: 'h-8 gap-1.5 rounded-full px-3 text-[13px] font-sans tracking-normal',
        lg: 'h-12 gap-2 px-6 font-sans text-[17px] leading-none tracking-normal',
        icon: 'h-9 w-9',
        'icon-xs':
          "h-6 w-6 rounded-full",
        'icon-sm':
          'h-8 w-8 rounded-full',
        'icon-lg': 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
