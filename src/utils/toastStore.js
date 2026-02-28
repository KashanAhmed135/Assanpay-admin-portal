const listeners = new Set()

let state = {
  toasts: [],
}

const emit = () => {
  listeners.forEach((listener) => listener())
}

const setState = (patch) => {
  state = { ...state, ...patch }
  emit()
}

export function getToastState() {
  return state
}

export function subscribeToast(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function pushToast({ message, requestId, variant = 'warning', timeoutMs = 6000 }) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const toast = { id, message, requestId, variant }
  setState({ toasts: [...state.toasts, toast] })

  if (timeoutMs > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, timeoutMs)
  }

  return id
}

export function dismissToast(id) {
  const next = state.toasts.filter((toast) => toast.id !== id)
  if (next.length !== state.toasts.length) {
    setState({ toasts: next })
  }
}

