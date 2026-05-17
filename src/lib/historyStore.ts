// /src/lib/useHistory.ts
import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initialPresent: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const undo = useCallback(() => {
    setState((prevState) => {
      if (prevState.past.length === 0) return prevState
      const previous = prevState.past[prevState.past.length - 1]
      const newPast = prevState.past.slice(0, prevState.past.length - 1)
      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((prevState) => {
      if (prevState.future.length === 0) return prevState
      const next = prevState.future[0]
      const newFuture = prevState.future.slice(1)
      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const setPresent = useCallback((newPresent: T, recordHistory = true) => {
    setState((prevState) => {
      if (recordHistory) {
        return {
          past: [...prevState.past, prevState.present],
          present: newPresent,
          future: [],
        }
      }
      return {
        past: prevState.past,
        present: newPresent,
        future: prevState.future,
      }
    })
  }, [])

  return { present: state.present, setPresent, undo, redo, canUndo, canRedo }
}