export default function EmptyState({ title, desc, action }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {desc && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
