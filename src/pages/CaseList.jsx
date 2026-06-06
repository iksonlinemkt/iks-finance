import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtNum } from '../utils/calc'
import { StatusBadge, ALL_STATUSES } from '../utils/statusConfig.jsx'
import { BRANCHES, SALES_LIST, FINANCE_LIST } from '../utils/dropdownData'
import { Search, RefreshCw, Eye, Pencil, RotateCcw, X } from 'lucide-react'

const MANAGE_STATUSES = ['รับใบคำขอ','ส่ง Finance','ขอเอกสารเพิ่มเติม','รอผล','ปรับเงื่อนไข','อนุมัติ','อนุมัติแบบปรับเงื่อนไข','ไม่อนุมัติ']

export default function CaseList() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', branch: '', sales: '', keyword: '' })
  const [viewCase, setViewCase] = useState(null)
  const [editCase, setEditCase] = useState(null)
  const [resubmitCase, setResubmitCase] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [resubmitForm, setResubmitForm] = useState({ finCode: '', finName: '', downReal: '', interest: '', term: '', installment: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCases() }, [])

  const fetchCases = async () => {
    setLoading(true)
    const { data } = await supabase.from('finance_cases').select('*').order('created_at', { ascending: false })
    setCases(data || [])
    setLoading(false)
  }

  const filtered = cases.filter(c => {
    if (filters.status && c.status !== filters.status) return false
    if (filters.branch && c.branch !== filters.branch) return false
    if (filters.sales && c.sales_code !== filters.sales) return false
    if (filters.keyword) {
      const q = filters.keyword.toLowerCase()
      if (![c.customer_name, c.case_id, c.sales_name, c.selling_name].some(f => (f||'').toLowerCase().includes(q))) return false
    }
    return true
  })

  const handleUpdateStatus = async () => {
    if (!newStatus) return
    setSaving(true)
    await supabase.from('finance_cases').update({ status: newStatus, note: statusNote }).eq('case_id', editCase.case_id)
    await supabase.from('status_logs').insert({
      case_id: editCase.case_id, old_status: editCase.status,
      new_status: newStatus, note: statusNote, updated_at: new Date().toISOString()
    })
    setSaving(false)
    setEditCase(null)
    fetchCases()
  }

  const handleResubmit = async () => {
    if (!resubmitForm.finCode) return
    setSaving(true)
    const { data: rounds } = await supabase.from('finance_rounds').select('round_no').eq('case_id', resubmitCase.case_id)
    const nextRound = (rounds?.length || 0) + 1
    await supabase.from('finance_rounds').insert({
      case_id: resubmitCase.case_id, round_no: nextRound,
      fin_code: resubmitForm.finCode, down_real: parseFloat(resubmitForm.downReal) || 0,
      interest: parseFloat(resubmitForm.interest) || 0, term: parseInt(resubmitForm.term) || 0,
      installment: parseFloat(resubmitForm.installment) || 0,
      note: resubmitForm.note, submit_date: new Date().toISOString(), result_status: 'รอผล'
    })
    await supabase.from('finance_cases').update({
      status: 'ส่ง Finance', fin_code: resubmitForm.finCode, round: nextRound
    }).eq('case_id', resubmitCase.case_id)
    setSaving(false)
    setResubmitCase(null)
    setResubmitForm({ finCode: '', finName: '', downReal: '', interest: '', term: '', installment: '', note: '' })
    fetchCases()
  }

  const fmt = (n) => n ? Number(n).toLocaleString('th-TH') + ' บาท' : '-'

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="form-label text-xs">ค้นหาลูกค้า / เลขเคส</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filters.keyword}
                onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))}
                className="form-input pl-8" placeholder="ค้นหา..." />
            </div>
          </div>
          <div className="w-44">
            <label className="form-label text-xs">สถานะ</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="form-select">
              <option value="">ทุกสถานะ</option>
              {MANAGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="form-label text-xs">สาขา</label>
            <select value={filters.branch} onChange={e => setFilters(p => ({ ...p, branch: e.target.value }))} className="form-select">
              <option value="">ทุกสาขา</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="form-label text-xs">ที่ปรึกษา</label>
            <select value={filters.sales} onChange={e => setFilters(p => ({ ...p, sales: e.target.value }))} className="form-select">
              <option value="">ทุกคน</option>
              {SALES_LIST.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={() => setFilters({ status: '', branch: '', sales: '', keyword: '' })} className="btn-secondary text-sm h-9">
            <X size={14} /> ล้าง
          </button>
          <button onClick={fetchCases} className="btn-primary text-sm h-9">
            <RefreshCw size={14} /> รีเฟรช
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">พบ {filtered.length} รายการ จากทั้งหมด {cases.length}</div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> กำลังโหลด...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['รหัสเคส','วันที่','ชื่อลูกค้า','รุ่นรถ','ไฟแนนซ์','ค่างวด','งวด','สถานะ','จัดการ'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">ไม่พบรายการ</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.case_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{c.case_id}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{c.submit_date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.selling_name || c.model_no}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-medium">{c.fin_code}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtNum(c.installment)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.term}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} round={c.round} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewCase(c)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="ดูรายละเอียด">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => { setEditCase(c); setNewStatus(c.status); setStatusNote('') }} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50" title="แก้ไขสถานะ">
                          <Pencil size={15} />
                        </button>
                        {c.status === 'ไม่อนุมัติ' && (
                          <button onClick={() => setResubmitCase(c)} className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 relative" title="ส่งไฟแนนซ์ใหม่">
                            <RotateCcw size={15} />
                            {c.round > 1 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-xs font-bold leading-none">
                                {c.round}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-bold text-gray-900">รายละเอียดเคส {viewCase.case_id}</h3>
              <button onClick={() => setViewCase(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['สถานะ', <StatusBadge status={viewCase.status} round={viewCase.round} />],
                    ['วันที่ส่ง', viewCase.submit_date],
                    ['สาขา', viewCase.branch],
                    ['ที่ปรึกษา', (viewCase.sales_code || '') + ' ' + (viewCase.sales_name || '')],
                    ['ไฟแนนซ์', (viewCase.fin_code || '') + ' - ' + (viewCase.fin_name || '')],
                    ['ลูกค้า', viewCase.customer_name],
                    ['โทร', viewCase.customer_phone],
                    ['รุ่นรถ', viewCase.model_no],
                    ['Selling Name', viewCase.selling_name],
                    ['สี', viewCase.car_color],
                    ['ราคารถรวม', fmt(viewCase.total_car_price)],
                    ['รวมดาวน์', fmt(viewCase.total_down)],
                    ['ยอดจัด', fmt(viewCase.finance_amount)],
                    ['ดอกเบี้ยจริง', viewCase.real_interest ? viewCase.real_interest.toFixed(2) + '%' : '-'],
                    ['งวด/ค่างวด', (viewCase.term || '-') + ' งวด / ' + fmtNum(viewCase.installment) + ' บาท'],
                    ['อาชีพ', viewCase.occupation],
                    ['หมายเหตุ', viewCase.note],
                  ].map(([k, v], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-3 font-medium text-gray-500 w-36">{k}</td>
                      <td className="py-2 px-3 text-gray-900">{v || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-bold">อัปเดตสถานะ</h3>
              <button onClick={() => setEditCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">เลขเคส</label>
                <input value={editCase.case_id} readOnly className="form-input bg-gray-50 font-mono text-sm" />
              </div>
              <div>
                <label className="form-label">สถานะใหม่ <span className="text-red-500">*</span></label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-select">
                  <option value="">เลือกสถานะ</option>
                  {MANAGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">หมายเหตุ</label>
                <textarea rows={3} value={statusNote} onChange={e => setStatusNote(e.target.value)} className="form-input resize-none" placeholder="ระบุรายละเอียด..." />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t justify-end">
              <button onClick={() => setEditCase(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleUpdateStatus} disabled={saving} className="btn-primary">
                {saving ? 'กำลังบันทึก...' : '💾 บันทึกสถานะ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {resubmitCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-display font-bold text-lg">🔄 ส่ง Finance ใหม่</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {resubmitCase.case_id} — รอบที่ {(resubmitCase.round || 1) + 1}
                </p>
              </div>
              <button onClick={() => setResubmitCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-6">
              {/* ซ้าย: ข้อมูลเดิม */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  ข้อมูลเดิม (รอบที่ {resubmitCase.round || 1})
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 text-sm">
                  {[
                    ['ลูกค้า', resubmitCase.customer_name],
                    ['รุ่นรถ', resubmitCase.selling_name || resubmitCase.model_no],
                    ['ราคารถรวม', fmt(resubmitCase.total_car_price)],
                    ['เงินดาวน์จริง', fmt(resubmitCase.down_real)],
                    ['รวมเงินดาวน์', fmt(resubmitCase.total_down)],
                    ['ยอดจัด', fmt(resubmitCase.finance_amount)],
                    ['ไฟแนนซ์เดิม', resubmitCase.fin_code || '-'],
                    ['ดอกเบี้ย', resubmitCase.real_interest ? resubmitCase.real_interest.toFixed(2) + '%' : '-'],
                    ['จำนวนงวด', resubmitCase.term ? resubmitCase.term + ' งวด' : '-'],
                    ['ค่างวด', fmt(resubmitCase.installment)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-gray-800">{v || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* ขวา: เงื่อนไขใหม่ */}
              <div>
                <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">
                  เงื่อนไขใหม่ (รอบที่ {(resubmitCase.round || 1) + 1})
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">ไฟแนนซ์ใหม่ <span className="text-red-500">*</span></label>
                    <select
                      value={resubmitForm.finCode}
                      onChange={e => {
                        const opt = FINANCE_LIST.find(f => f.code === e.target.value)
                        setResubmitForm(p => ({ ...p, finCode: e.target.value, finName: opt ? opt.name : '' }))
                      }}
                      className="form-select"
                    >
                      <option value="">เลือกไฟแนนซ์...</option>
                      {FINANCE_LIST.map(f => (
                        <option key={f.code} value={f.code}>{f.code} — {f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">เงินดาวน์จริง</label>
                    <input type="number" value={resubmitForm.downReal}
                      onChange={e => setResubmitForm(p => ({ ...p, downReal: e.target.value }))}
                      className="form-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">ดอกเบี้ย (%)</label>
                    <input type="number" step="0.01" value={resubmitForm.interest}
                      onChange={e => setResubmitForm(p => ({ ...p, interest: e.target.value }))}
                      className="form-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">จำนวนงวด</label>
                    <input type="number" value={resubmitForm.term}
                      onChange={e => setResubmitForm(p => ({ ...p, term: e.target.value }))}
                      className="form-input" placeholder="60" />
                  </div>
                  <div>
                    <label className="form-label">ค่างวด</label>
                    <input type="number" value={resubmitForm.installment}
                      onChange={e => setResubmitForm(p => ({ ...p, installment: e.target.value }))}
                      className="form-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">หมายเหตุ</label>
                    <textarea rows={2} value={resubmitForm.note}
                      onChange={e => setResubmitForm(p => ({ ...p, note: e.target.value }))}
                      className="form-input resize-none" placeholder="เหตุผลการส่งใหม่..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t justify-end">
              <button onClick={() => setResubmitCase(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleResubmit} disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <RotateCcw size={15} /> {saving ? 'กำลังส่ง...' : 'ส่ง Finance ใหม่'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
