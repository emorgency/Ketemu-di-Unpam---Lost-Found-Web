import { Component } from 'react'
import { logger } from '../lib/logger'

// T-039: batas error global agar crash satu halaman tidak mematikan seluruh app,
// sekaligus mencatat ke app_logs untuk monitoring.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Terjadi kesalahan' }
  }

  componentDidCatch(error, info) {
    logger.error('ErrorBoundary', error?.message || 'Render error', {
      stack: String(error?.stack || '').slice(0, 2000),
      componentStack: String(info?.componentStack || '').slice(0, 2000),
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900">Terjadi kesalahan</h1>
          <p className="mt-1 text-sm text-gray-500">{this.state.message}</p>
          <p className="mt-1 text-xs text-gray-400">Kejadian ini tercatat di log aplikasi untuk ditindaklanjuti.</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Coba lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
