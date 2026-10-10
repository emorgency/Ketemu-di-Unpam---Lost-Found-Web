export default function ConfirmDialog({ open, title, desc, confirmLabel = 'Konfirmasi', onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {desc && <p className="mt-1 text-sm text-gray-600">{desc}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">Batal</button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
