import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from '../lib/monitoring'
import { getUserMessage, logDisplayedError } from '../services/api/apiError'
import ErrorState from './ui/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logDisplayedError(error, {
      component: 'ErrorBoundary',
      componentStack: info.componentStack ?? undefined,
    })
    captureException(error, { componentStack: info.componentStack ?? 'unknown' })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackTitle
        ?? getUserMessage(this.state.error, 'Something went wrong. Please refresh the page.')

      return (
        <div className="container page-main">
          <ErrorState message={message} />
          <button type="button" className="btn btn-secondary" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
