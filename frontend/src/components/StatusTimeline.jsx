function fmt(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function StatusTimeline({ events }) {
  if (!events || !events.length) {
    return <p className="text-sm text-gray-500">Belum ada riwayat penanganan.</p>
  }
  return (
    <ol className="relative space-y-4 border-l border-gray-200 pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
          <p className="text-xs text-gray-500">{fmt(e.at)}</p>
          <p className="text-sm font-medium text-gray-900">{e.title}</p>
          {e.desc && <p className="text-sm text-gray-600">{e.desc}</p>}
          {e.actor && <p className="text-xs text-gray-400">oleh {e.actor}</p>}
        </li>
      ))}
    </ol>
  )
}
