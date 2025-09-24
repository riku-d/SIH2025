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
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto">
          <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}


