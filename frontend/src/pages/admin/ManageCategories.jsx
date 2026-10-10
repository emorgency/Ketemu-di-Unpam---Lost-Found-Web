import { useEffect, useState } from 'react'
import { listCategories } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import BackButton from '../../components/BackButton'

export default function ManageCategories() {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      setRows(await listCategories())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama kategori wajib')
      return
    }
    const { error } = await supabase.from('categories').insert({ name: name.trim(), description: desc || null })
    if (error) setError(error.message)
    else {
      setName('')
      setDesc('')
      load()
    }
  }

  async function remove(id) {
    if (!window.confirm('Hapus kategori?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton to="/officer" />
      <h1 className="text-xl font-bold">Kelola Kategori</h1>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kategori" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Tambah</button>
      </form>
      <div className="space-y-1">
        {rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div><b>{c.name}</b><p className="text-xs text-gray-500">{c.description}</p></div>
            <button onClick={() => remove(c.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  )
}
