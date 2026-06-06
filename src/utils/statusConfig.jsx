export const STATUS_CONFIG = {
  'รับใบคำขอ':               { color: 'bg-blue-100 text-blue-700',    icon: '📋', dot: 'bg-blue-500' },
  'ส่ง Finance':             { color: 'bg-yellow-100 text-yellow-700', icon: '📤', dot: 'bg-yellow-500' },
  'ขอเอกสารเพิ่มเติม':      { color: 'bg-orange-100 text-orange-700', icon: '📎', dot: 'bg-orange-500' },
  'รอผล':                   { color: 'bg-purple-100 text-purple-700', icon: '⏳', dot: 'bg-purple-500' },
  'ปรับเงื่อนไข':            { color: 'bg-cyan-100 text-cyan-700',    icon: '🔧', dot: 'bg-cyan-500' },
  'อนุมัติ':                 { color: 'bg-emerald-100 text-emerald-700', icon: '✅', dot: 'bg-emerald-500' },
  'อนุมัติแบบปรับเงื่อนไข': { color: 'bg-teal-100 text-teal-700',    icon: '✅', dot: 'bg-teal-500' },
  'ไม่อนุมัติ':              { color: 'bg-red-100 text-red-700',      icon: '❌', dot: 'bg-red-500' },
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG)

export function StatusBadge({ status, round }) {
  const cfg = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-600', icon: '•' }
  return (
    <span className={'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ' + cfg.color}>
      <span>{cfg.icon}</span>
      <span>{status}</span>
      {round && round > 1 && (
        <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-xs font-bold">
          {round}
        </span>
      )}
    </span>
  )
}
