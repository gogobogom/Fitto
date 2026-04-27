'use client'

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="max-w-md p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Bir hata oluştu</h3>
                <p className="text-sm text-muted-foreground">
                  Üzgünüz, bir şeyler yanlış gitti. Lütfen tekrar deneyin.
                </p>
                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Hata detayları
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <Button onClick={this.handleReset} className="w-full">
                Tekrar Dene
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
