// T-039: structured application logger.
// - Level: DEBUG, INFO, WARN, ERROR, FATAL
// - Buffer + batch insert ke public.app_logs (best-effort, tidak melempar)
// - Fallback localStorage bila offline / insert gagal
// - Jangan pernah mengirim data sensitif (NIM penuh, KTP, evidence bytes)

import { supabase } from './supabase'

const LS_KEY = 'lnf_app_logs_fallback'
const BUFFER_FLUSH_MS = 5000
const MAX_BUFFER = 20

let buffer = []
let flushTimer = null
let currentUserId = null

export function setLogUser(userId) {
  currentUserId = userId || null
}

function sanitize(details) {
  if (!details || typeof details !== 'object') return details ?? null
  const clone = Array.isArray(details) ? [...details] : { ...details }
  for (const k of ['nim', 'ktp', 'phone', 'password', 'evidence', 'token']) {
    if (k in clone) clone[k] = '[redacted]'
  }
  try {
    return JSON.parse(JSON.stringify(clone).slice(0, 4000))
  } catch {
    return null
  }
}

async function flush() {
  if (!buffer.length) return
  const batch = buffer.splice(0, buffer.length)
  try {
    const { error } = await supabase.from('app_logs').insert(batch)
    if (error) throw error
  } catch {
    // fallback: simpan lokal, maks 100 entri
    try {
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
      const merged = [...prev, ...batch].slice(-100)
      localStorage.setItem(LS_KEY, JSON.stringify(merged))
    } catch { /* abaikan */ }
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, BUFFER_FLUSH_MS)
}

export function logEvent(level, scope, message, details) {
  const entry = {
    level,
    scope: scope || 'frontend',
    message: String(message || '').slice(0, 1000),
    details: sanitize(details),
    user_id: currentUserId,
    url: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
  }
  if (level === 'ERROR' || level === 'FATAL') {
    console.error(`[${scope}]`, message, details || '')
  } else if (level === 'WARN') {
    console.warn(`[${scope}]`, message, details || '')
  }
  buffer.push(entry)
  if (buffer.length >= MAX_BUFFER) {
    flush()
  } else {
    scheduleFlush()
  }
  return entry
}

export const logger = {
  debug: (scope, msg, d) => logEvent('DEBUG', scope, msg, d),
  info: (scope, msg, d) => logEvent('INFO', scope, msg, d),
  warn: (scope, msg, d) => logEvent('WARN', scope, msg, d),
  error: (scope, msg, d) => logEvent('ERROR', scope, msg, d),
  fatal: (scope, msg, d) => logEvent('FATAL', scope, msg, d),
}

export function getFallbackLogs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

export function clearFallbackLogs() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch { /* abaikan */ }
}
