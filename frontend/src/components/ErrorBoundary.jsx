import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Detail goes to the console for developers, never to the screen.
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-ground flex items-center justify-center p-6">
        <div className="card max-w-md w-full">
          <div className="card-body text-center">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-danger-50 text-danger-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="section-title mb-2">Something went wrong</h1>
            <p className="text-body mb-6">
              The page ran into a problem. Reloading usually fixes it — your data is safe.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
              Reload the page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
