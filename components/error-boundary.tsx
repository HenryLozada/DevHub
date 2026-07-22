import * as React from "react"
import { RippleButton } from "@/components/ui/ripple-button"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#fafafc] p-8">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Algo salio mal</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Ocurrio un error inesperado. Intenta recargar la pagina.
            </p>
            <RippleButton
              onClick={() => window.location.reload()}
              rippleColor="#ffffff"
              duration="600ms"
              className="rounded-full bg-[#0066cc] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] transition-colors overflow-hidden"
            >
              Recargar pagina
            </RippleButton>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
