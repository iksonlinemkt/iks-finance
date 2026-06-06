import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export default function SearchableSelect({ options, value, onChange, placeholder, displayKey, valueKey, searchKeys, label }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const filtered = query
    ? options.filter(o => {
        const keys = searchKeys || [displayKey, valueKey]
        return keys.some(k => String(o[k] || '').toLowerCase().includes(query.toLowerCase()))
      })
    : options

  const selected = options.find(o => (valueKey ? o[valueKey] : o) === value)
  const displayVal = selected ? (displayKey ? selected[displayKey] : selected) : ''

  const handleSelect = (opt) => {
    onChange(valueKey ? opt[valueKey] : opt, opt)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('', null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <div
        className="form-input flex items-center justify-between cursor-pointer min-h-[38px]"
        onClick={() => setOpen(!open)}
      >
        <span className={displayVal ? 'text-gray-900' : 'text-gray-400'}>
          {displayVal || placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {value && (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ค้นหา..."
                className="text-sm outline-none bg-transparent w-full"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">ไม่พบข้อมูล</div>
            ) : (
              filtered.map((opt, i) => {
                const val = valueKey ? opt[valueKey] : opt
                const disp = displayKey ? opt[displayKey] : opt
                const isSelected = val === value
                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {label ? label(opt) : disp}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
