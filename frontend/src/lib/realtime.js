// T-039 / Iterasi 3: sinkronisasi realtime + refresh saat tab aktif kembali.
// Dipakai halaman daftar agar data sinkron antar role tanpa reload manual.
// Prasyarat DB: migrasi 008 (tabel masuk publikasi supabase_realtime).

import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

export function useRealtimeRefresh(tables, onChange) {
  const cbRef = useRef(null)
  // Disimpan via effect (bukan saat render) agar callback selalu fresh
  // mengikuti state terbaru tanpa melanggar aturan hooks.
  useEffect(() => {
    cbRef.current = onChange
  })
  const key = tables.join(',')

  useEffect(() => {
    const list = key.split(',')
    const ch = supabase.channel(`lnf-${list.join('-')}`)
    for (const t of list) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => {
        try {
          cbRef.current?.()
        } catch { /* abaikan */ }
      })
    }
    ch.subscribe()

    function onVisible() {
      if (document.visibilityState === 'visible') {
        try {
          cbRef.current?.()
        } catch { /* abaikan */ }
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
