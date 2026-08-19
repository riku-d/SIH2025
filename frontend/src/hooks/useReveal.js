import { useEffect } from 'react'

/**
 * Scroll-triggered reveal via IntersectionObserver — no library, no
 * scroll listener, and it unobserves after firing so it costs nothing
 * on a low-end phone.
 *
 * Content is visible by default; the `js-reveal` class on <html> is what
 * opts into hiding, and it is only ever set here. A watchdog reveals
 * everything regardless after a moment, so a hidden container or a
 * zero-size viewport can never leave the page blank.
 */
export default function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'))
    if (!nodes.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) return

    const root = document.documentElement
    root.classList.add('js-reveal')

    const revealAll = () => nodes.forEach(n => n.classList.add('reveal-in'))

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const delay = Number(entry.target.dataset.revealDelay || 0)
        setTimeout(() => entry.target.classList.add('reveal-in'), delay)
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 })

    nodes.forEach(n => observer.observe(n))

    // Safety net: nothing stays invisible for longer than this.
    const watchdog = setTimeout(revealAll, 2000)

    return () => {
      clearTimeout(watchdog)
      observer.disconnect()
      root.classList.remove('js-reveal')
    }
  }, [])
}
