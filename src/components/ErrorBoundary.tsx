'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Ignorer les AbortError - ne pas afficher d'erreur
    if (
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('signal is aborted')
    ) {
      return { hasError: false }
    }
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Ignorer silencieusement les AbortError
    if (
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('signal is aborted')
    ) {
      // Reset l'état pour permettre le re-render
      this.setState({ hasError: false })
      return
    }
    console.error('Error caught by boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <h2 className="text-xl mb-4">Une erreur est survenue</h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-2 bg-[#C9A962] text-white rounded hover:bg-[#19110B] transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
