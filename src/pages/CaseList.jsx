import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtNum, calcFinance, parseNum } from '../utils/calc'
import { StatusBadge } from '../utils/statusConfig.jsx'
import { BRANCHES, SALES_LIST, FINANCE_LIST, MODEL_LIST, COLOR_LIST, INSURANCE_LIST, CAMPAIGN_LIST, OCCUPATION_LIST } from '../utils/dropdownData'
import SearchableSelect from '../components/SearchableSelect'
import { Search, RefreshCw, Eye, Pencil, RotateCcw, X, History, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react'

const MANAGE_STATUSES = ['รับใบคำขอ','ส่ง Finance','ขอเอกสารเพิ่มเติม','รอผล','ปรับเงื่อนไข','อนุมัติ','อนุมัติแบบปรับเงื่อนไข','ไม่อนุมัติ']

const initEdit = {
  branch:'', salesCode:'', salesName:'', finCode:'', finName:'', comFinance:'',
  customerName:'', customerPhone:'', modelNo:'', sellingName:'', carColor:'',
  carPrice:'', equipment:'', subDownAdd:'', discountCRP:'',
  downReal:'', discountDown:'', discountSubDown:'',
  interest:'', interestDiscount:'', term:'', insurance:'', campaign:'', occupation:'', note:''
}

export default function CaseList() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status:'', branch:'', sales:'', keyword:'' })
  const [viewCase, setViewCase] = useState(null)
  const [editCase, setEditCase] = useState(null)
  const [editForm, setEditForm] = useState(initEdit)
  const [editCalc, setEditCalc] = useState({})
  const [editNote, setEditNote] = useState('')
  const [historyCase, setHistoryCase] = useState(null)
  const [historyLogs, setHistoryLogs] = useState([])
  const [statusCase, setStatusCase] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [resubmitCase, setResubmitCase] = useState(null)
  const [resubmitForm, setResubmitForm] = useState({ finCode:'', finName:'', downReal:'', interest:'', term:'', installment:'', note:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCases() }, [])
  useEffect(() => { setEditCalc(calcFinance(editForm)) }, [editForm])

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

  const openEdit = (c) => {
    setEditCase(c)
    setEditNote('')
    setEditForm({
      branch: c.branch || '', salesCode: c.sales_code || '', salesName: c.sales_name || '',
      finCode: c.fin_code || '', finName: c.fin_name || '', comFinance: c.com_finance || '',
      customerName: c.customer_name || '', customerPhone: c.customer_phone || '',
      modelNo: c.model_no || '', sellingName: c.selling_name || '', carColor: c.car_color || '',
      carPrice: c.car_price || '', equipment: c.equipment || '', subDownAdd: c.sub_down_add || '',
      discountCRP: c.discount_crp || '', downReal: c.down_real || '',
      discountDown: c.discount_down || '', discountSubDown: c.discount_sub_down || '',
      interest: c.interest || '', interestDiscount: c.interest_discount || '',
      term: c.term || '', insurance: c.insurance || '', campaign: c.campaign || '',
      occupation: c.occupation || '', note: c.note || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editCase) return
    setSaving(true)
    const c = calcFinance(editForm)
    const newEditCount = (editCase.edit_count || 0) + 1

    // snapshot ก่อนแก้
    const beforeData = {
      branch: editCase.branch, fin_code: editCase.fin_code,
      car_price: editCase.car_price, down_real: editCase.down_real,
      total_car_price: editCase.total_car_price, total_down: editCase.total_down,
      finance_amount: editCase.finance_amount, interest: editCase.interest,
      real_interest: editCase.real_interest, term: editCase.term, installment: editCase.installment
    }

    await supabase.from('finance_cases').update({
      branch: editForm.branch, sales_code: editForm.salesCode, sales_name: editForm.salesName,
      fin_code: editForm.finCode, fin_name: editForm.finName, com_finance: parseNum(editForm.comFinance),
      customer_name: editForm.customerName, customer_phone: editForm.customerPhone,
      model_no: editForm.modelNo, selling_name: editForm.sellingName, car_color: editForm.carColor,
      car_price: parseNum(editForm.carPrice), equipment: parseNum(editForm.equipment),
      sub_down_add: parseNum(editForm.subDownAdd), discount_crp: parseNum(editForm.discountCRP),
      total_car_price: c.totalCarPrice, down_real: parseNum(editForm.downReal),
      discount_down: parseNum(editForm.discountDown), discount_sub_down: parseNum(editForm.discountSubDown),
      total_down: c.totalDown, finance_amount: c.financeAmount,
      interest: parseNum(editForm.interest), interest_discount: parseNum(editForm.interestDiscount),
      real_interest: c.realInterest, term: parseNum(editForm.term), installment: c.installment,
      insurance: editForm.insurance, campaign: editForm.campaign, occupation: editForm.occupation,
      note: editForm.note, edit_count: newEditCount, last_edited_at: new Date().toISOString()
    }).eq('case_id', editCase.case_id)

    await supabase.from('edit_logs').insert({
      case_id: editCase.case_id, edit_no: newEditCount,
      edited_at: new Date().toISOString(),
      before_data: beforeData,
      after_data: {
        branch: editForm.branch, fin_code: editForm.finCode,
        car_price: parseNum(editForm.carPrice), down_real: parseNum(editForm.downReal),
        total_car_price: c.totalCarPrice, total_down: c.totalDown,
        finance_amount: c.financeAmount, interest: parseNum(editForm.interest),
        real_interest: c.realInterest, term: parseNum(editForm.term), installment: c.installment
      },
      note: editNote
    })

    setSaving(false)
    setEditCase(null)
    fetchCases()
  }

  const openHistory = async (c) => {
    setHistoryCase(c)
    const { data } = await supabase.from('edit_logs').select('*').eq('case_id', c.case_id).order('edit_no', { ascending: false })
    setHistoryLogs(data || [])
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return
    setSaving(true)
    await supabase.from('finance_cases').update({ status: newStatus, note: statusNote }).eq('case_id', statusCase.case_id)
    await supabase.from('status_logs').insert({
      case_id: statusCase.case_id, old_status: statusCase.status,
      new_status: newStatus, note: statusNote, updated_at: new Date().toISOString()
    })
    setSaving(false)
    setStatusCase(null)
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
    await supabase.from('finance_cases').update({ status: 'ส่ง Finance', fin_code: resubmitForm.finCode, round: nextRound }).eq('case_id', resubmitCase.case_id)
    setSaving(false)
    setResubmitCase(null)
    setResubmitForm({ finCode:'', finName:'', downReal:'', interest:'', term:'', installment:'', note:'' })
    fetchCases()
  }

  const handleExportCSV = () => {
    if (!cases.length) return
    const headers = [
      'case_id','submit_date','branch','sales_code','sales_name','fin_code','fin_name',
      'customer_name','customer_phone','model_no','selling_name','car_color',
      'car_price','equipment','sub_down_add','discount_crp','total_car_price',
      'down_real','discount_down','discount_sub_down','total_down','finance_amount',
      'interest','interest_discount','real_interest','term','installment',
      'insurance','campaign','occupation','status','round','edit_count','note','created_at'
    ]
    const rows = cases.map(c => headers.map(h => {
      const v = c[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'string' && v.includes(',')) return '"' + v + '"'
      return v
    }).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'iks-finance-' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''))
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',')
      const obj = {}
      headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/"/g,'').trim() })
      return obj
    })
    const confirmed = window.confirm('พบข้อมูล ' + rows.length + ' แถว ต้องการนำเข้าไหม?')
    if (!confirmed) { e.target.value = ''; return }
    setSaving(true)
    let success = 0, fail = 0
    for (const row of rows) {
      if (!row.case_id) continue
      const { error } = await supabase.from('finance_cases').upsert({
        case_id: row.case_id, submit_date: row.submit_date || null,
        branch: row.branch || '', sales_code: row.sales_code || '', sales_name: row.sales_name || '',
        fin_code: row.fin_code || '', fin_name: row.fin_name || '',
        customer_name: row.customer_name || '', customer_phone: row.customer_phone || '',
        model_no: row.model_no || '', selling_name: row.selling_name || '', car_color: row.car_color || '',
        car_price: parseFloat(row.car_price)||0, total_car_price: parseFloat(row.total_car_price)||0,
        down_real: parseFloat(row.down_real)||0, total_down: parseFloat(row.total_down)||0,
        finance_amount: parseFloat(row.finance_amount)||0, interest: parseFloat(row.interest)||0,
        real_interest: parseFloat(row.real_interest)||0, term: parseInt(row.term)||0,
        installment: parseFloat(row.installment)||0, insurance: row.insurance||'',
        campaign: row.campaign||'', occupation: row.occupation||'',
        status: row.status||'รับใบคำขอ', round: parseInt(row.round)||1, note: row.note||'',
      }, { onConflict: 'case_id' })
      if (error) fail++; else success++
    }
    setSaving(false)
    alert('นำเข้าสำเร็จ ' + success + ' แถว, ผิดพลาด ' + fail + ' แถว')
    e.target.value = ''
    fetchCases()
  }

  const fmt = (n) => n ? Number(n).toLocaleString('th-TH') + ' บาท' : '-'
  const setEF = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="form-label text-xs">ค้นหาลูกค้า / เลขเคส</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} className="form-input pl-8" placeholder="ค้นหา..." />
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
          <button onClick={() => setFilters({ status:'', branch:'', sales:'', keyword:'' })} className="btn-secondary text-sm h-9"><X size={14} /> ล้าง</button>
          <button onClick={fetchCases} className="btn-primary text-sm h-9"><RefreshCw size={14} /> รีเฟรช</button>
          <button onClick={handleExportCSV} className="btn-secondary text-sm h-9"><Download size={14} /> Export CSV</button>
          <label className="btn-secondary text-sm h-9 cursor-pointer">
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
        </div>
        <div className="mt-2 text-xs text-gray-400">พบ {filtered.length} รายการ จากทั้งหมด {cases.length}</div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400"><RefreshCw size={20} className="animate-spin mr-2" /> กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['รหัสเคส','วันที่','ชื่อลูกค้า','รุ่นรถ','ไฟแนนซ์','ค่างวด','งวด','แก้ไข','สถานะ','จัดการ'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">ไม่พบรายการ</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.case_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-brand-600">{c.case_id}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{c.submit_date}</td>
                    <td className="px-3 py-3 font-medium text-gray-900">{c.customer_name}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{c.selling_name || c.model_no}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs font-medium">{c.fin_code}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-800">{fmtNum(c.installment)}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{c.term}</td>
                    <td className="px-3 py-3 text-center">
                      {c.edit_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          ✏️ ครั้งที่ {c.edit_count}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} round={c.round} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewCase(c)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" title="ดูรายละเอียด"><Eye size={15} /></button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50" title="แก้ไขใบคำขอ"><Pencil size={15} /></button>
                        <button onClick={() => openHistory(c)} className="p-1.5 rounded-md text-purple-500 hover:bg-purple-50" title="ประวัติการแก้ไข"><History size={15} /></button>
                        <button onClick={() => { setStatusCase(c); setNewStatus(c.status); setStatusNote('') }} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50" title="อัปเดตสถานะ">
                          <span className="text-xs font-bold">S</span>
                        </button>
                        {c.status === 'ไม่อนุมัติ' && (
                          <button onClick={() => setResubmitCase(c)} className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 relative" title="ส่งไฟแนนซ์ใหม่">
                            <RotateCcw size={15} />
                            {c.round > 1 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-xs font-bold leading-none">{c.round}</span>}
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
              <h3 className="font-display font-bold">รายละเอียดเคส {viewCase.case_id}</h3>
              <button onClick={() => setViewCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['สถานะ', <StatusBadge status={viewCase.status} round={viewCase.round} />],
                    ['แก้ไขแล้ว', viewCase.edit_count > 0 ? `${viewCase.edit_count} ครั้ง (ล่าสุด: ${viewCase.last_edited_at ? new Date(viewCase.last_edited_at).toLocaleDateString('th-TH') : '-'})` : 'ยังไม่มีการแก้ไข'],
                    ['วันที่ส่ง', viewCase.submit_date], ['สาขา', viewCase.branch],
                    ['ที่ปรึกษา', (viewCase.sales_code||'') + ' ' + (viewCase.sales_name||'')],
                    ['ไฟแนนซ์', (viewCase.fin_code||'') + ' ' + (viewCase.fin_name||'')],
                    ['ลูกค้า', viewCase.customer_name], ['โทร', viewCase.customer_phone],
                    ['รุ่นรถ', viewCase.selling_name], ['สี', viewCase.car_color],
                    ['ราคารถรวม', fmt(viewCase.total_car_price)], ['รวมดาวน์', fmt(viewCase.total_down)],
                    ['ยอดจัด', fmt(viewCase.finance_amount)], ['ดอกเบี้ยจริง', viewCase.real_interest ? viewCase.real_interest.toFixed(2)+'%' : '-'],
                    ['งวด/ค่างวด', (viewCase.term||'-') + ' งวด / ' + fmtNum(viewCase.installment) + ' บาท'],
                    ['อาชีพ', viewCase.occupation], ['หมายเหตุ', viewCase.note],
                  ].map(([k,v],i) => (
                    <tr key={i} className={i%2===0?'bg-gray-50':''}>
                      <td className="py-2 px-3 font-medium text-gray-500 w-36">{k}</td>
                      <td className="py-2 px-3 text-gray-900">{v||'-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {editCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-display font-bold text-lg">✏️ แก้ไขใบคำขอ</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editCase.case_id} — แก้ไขครั้งที่ {(editCase.edit_count || 0) + 1}
                  {editCase.edit_count > 0 && <span className="ml-2 text-orange-500">ผ่านการแก้ไขแล้ว {editCase.edit_count} ครั้ง</span>}
                </p>
              </div>
              <button onClick={() => setEditCase(null)}><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* ข้อมูลการส่ง */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ข้อมูลการส่ง</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">สาขา</label>
                    <SearchableSelect options={BRANCHES.map(b=>({label:b,value:b}))} value={editForm.branch} onChange={v=>setEF('branch',v)} placeholder="เลือกสาขา" displayKey="label" valueKey="value" />
                  </div>
                  <div>
                    <label className="form-label">ไฟแนนซ์</label>
                    <SearchableSelect options={FINANCE_LIST} value={editForm.finCode}
                      onChange={(v,opt) => { setEF('finCode',v); if(opt) setEF('finName',opt.name) }}
                      placeholder="เลือกไฟแนนซ์..." displayKey="code" valueKey="code"
                      label={o => <div><span className="font-semibold text-brand-600 w-16 inline-block">{o.code}</span><span className="text-gray-600 text-xs ml-2">{o.name}</span></div>} />
                  </div>
                </div>
              </div>

              {/* ราคารถ */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ราคารถ</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['ราคารถ','carPrice'],['ราคาอุปกรณ์','equipment'],
                    ['บวก Sub Down','subDownAdd'],['ลดราคา CRP','discountCRP']
                  ].map(([lbl,key]) => (
                    <div key={key}>
                      <label className="form-label">{lbl}</label>
                      <input type="number" value={editForm[key]} onChange={e=>setEF(key,e.target.value)} className="form-input" placeholder="0" />
                    </div>
                  ))}
                  <div className="col-span-2 md:col-span-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-between">
                      <span className="text-blue-700 font-semibold">ราคารถรวม</span>
                      <span className="text-blue-700 font-bold text-xl">{fmtNum(editCalc.totalCarPrice) || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* เงินดาวน์ */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">เงินดาวน์</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ['เงินดาวน์จริง','downReal'],['ลดดาวน์','discountDown'],['ลด Sub Down','discountSubDown']
                  ].map(([lbl,key]) => (
                    <div key={key}>
                      <label className="form-label">{lbl}</label>
                      <input type="number" value={editForm[key]} onChange={e=>setEF(key,e.target.value)} className="form-input" placeholder="0" />
                    </div>
                  ))}
                  <div className="col-span-2 md:col-span-3">
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-center justify-between">
                      <span className="text-emerald-700 font-semibold">รวมเงินดาวน์</span>
                      <span className="text-emerald-700 font-bold text-xl">{fmtNum(editCalc.totalDown) || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ค่างวด */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">รายละเอียดค่างวด</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="form-label">ยอดจัด</label>
                    <div className="form-input bg-gray-50 font-semibold">{fmtNum(editCalc.financeAmount)||'-'}</div>
                  </div>
                  <div>
                    <label className="form-label">ดอกเบี้ย (%)</label>
                    <input type="number" step="0.01" value={editForm.interest} onChange={e=>setEF('interest',e.target.value)} className="form-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">ส่วนลดดอกเบี้ย (%)</label>
                    <input type="number" step="0.01" value={editForm.interestDiscount} onChange={e=>setEF('interestDiscount',e.target.value)} className="form-input" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">จำนวนงวด</label>
                    <input type="number" value={editForm.term} onChange={e=>setEF('term',e.target.value)} className="form-input" placeholder="60" />
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <div className="bg-brand-50 rounded-lg p-3 border border-brand-100 flex items-center justify-between">
                      <span className="text-brand-700 font-semibold">ค่างวด / เดือน</span>
                      <span className="text-brand-700 font-bold text-2xl">{fmtNum(editCalc.installment) || '-'} บาท</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* หมายเหตุการแก้ไข */}
              <div>
                <label className="form-label font-semibold text-orange-600">เหตุผลการแก้ไข (บันทึกไว้ใน log)</label>
                <textarea rows={2} value={editNote} onChange={e=>setEditNote(e.target.value)} className="form-input resize-none border-orange-200 focus:ring-orange-400" placeholder="ระบุเหตุผลการแก้ไข เช่น ลูกค้าขอเพิ่มดาวน์..." />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t justify-end sticky bottom-0 bg-white">
              <button onClick={() => setEditCase(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn-success">
                {saving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข (ครั้งที่ ' + ((editCase.edit_count||0)+1) + ')'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-display font-bold">📋 ประวัติการแก้ไข</h3>
                <p className="text-xs text-gray-400 mt-0.5">{historyCase.case_id} — {historyCase.customer_name}</p>
              </div>
              <button onClick={() => setHistoryCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5">
              {historyLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">ยังไม่มีประวัติการแก้ไข</div>
              ) : (
                <div className="space-y-4">
                  {historyLogs.map(log => (
                    <div key={log.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="bg-orange-50 px-4 py-2 flex items-center justify-between">
                        <span className="font-semibold text-orange-700 text-sm">✏️ แก้ไขครั้งที่ {log.edit_no}</span>
                        <span className="text-xs text-gray-500">{log.edited_at ? new Date(log.edited_at).toLocaleString('th-TH') : '-'}</span>
                      </div>
                      {log.note && <div className="px-4 py-2 bg-yellow-50 text-sm text-yellow-800 border-b border-yellow-100">💬 {log.note}</div>}
                      <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-semibold text-red-500 mb-2">ก่อนแก้</div>
                          {log.before_data && Object.entries(log.before_data).map(([k,v]) => (
                            <div key={k} className="flex justify-between py-0.5 border-b border-gray-50">
                              <span className="text-gray-500">{k}</span>
                              <span className="text-gray-700">{v || '-'}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-500 mb-2">หลังแก้</div>
                          {log.after_data && Object.entries(log.after_data).map(([k,v]) => (
                            <div key={k} className="flex justify-between py-0.5 border-b border-gray-50">
                              <span className="text-gray-500">{k}</span>
                              <span className="text-gray-700 font-medium">{v || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-bold">อัปเดตสถานะ</h3>
              <button onClick={() => setStatusCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">เลขเคส</label>
                <input value={statusCase.case_id} readOnly className="form-input bg-gray-50 font-mono text-sm" />
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
              <button onClick={() => setStatusCase(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleUpdateStatus} disabled={saving} className="btn-primary">{saving ? 'กำลังบันทึก...' : '💾 บันทึกสถานะ'}</button>
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
                <p className="text-xs text-gray-400 mt-0.5">{resubmitCase.case_id} — รอบที่ {(resubmitCase.round||1)+1}</p>
              </div>
              <button onClick={() => setResubmitCase(null)}><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ข้อมูลเดิม (รอบที่ {resubmitCase.round||1})</div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 text-sm">
                  {[
                    ['ลูกค้า', resubmitCase.customer_name],
                    ['รุ่นรถ', resubmitCase.selling_name||resubmitCase.model_no],
                    ['ราคารถรวม', fmt(resubmitCase.total_car_price)],
                    ['เงินดาวน์จริง', fmt(resubmitCase.down_real)],
                    ['รวมเงินดาวน์', fmt(resubmitCase.total_down)],
                    ['ยอดจัด', fmt(resubmitCase.finance_amount)],
                    ['ไฟแนนซ์เดิม', resubmitCase.fin_code||'-'],
                    ['ดอกเบี้ย', resubmitCase.real_interest ? resubmitCase.real_interest.toFixed(2)+'%' : '-'],
                    ['จำนวนงวด', resubmitCase.term ? resubmitCase.term+' งวด' : '-'],
                    ['ค่างวด', fmt(resubmitCase.installment)],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-gray-800">{v||'-'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">เงื่อนไขใหม่ (รอบที่ {(resubmitCase.round||1)+1})</div>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">ไฟแนนซ์ใหม่ <span className="text-red-500">*</span></label>
                    <select value={resubmitForm.finCode} onChange={e => { const opt=FINANCE_LIST.find(f=>f.code===e.target.value); setResubmitForm(p=>({...p,finCode:e.target.value,finName:opt?opt.name:''})) }} className="form-select">
                      <option value="">เลือกไฟแนนซ์...</option>
                      {FINANCE_LIST.map(f => <option key={f.code} value={f.code}>{f.code} — {f.name}</option>)}
                    </select>
                  </div>
                  {[['เงินดาวน์จริง','downReal'],['ดอกเบี้ย (%)','interest'],['จำนวนงวด','term'],['ค่างวด','installment']].map(([lbl,key]) => (
                    <div key={key}>
                      <label className="form-label">{lbl}</label>
                      <input type="number" step={key==='interest'?'0.01':'1'} value={resubmitForm[key]} onChange={e=>setResubmitForm(p=>({...p,[key]:e.target.value}))} className="form-input" placeholder="0" />
                    </div>
                  ))}
                  <div>
                    <label className="form-label">หมายเหตุ</label>
                    <textarea rows={2} value={resubmitForm.note} onChange={e=>setResubmitForm(p=>({...p,note:e.target.value}))} className="form-input resize-none" placeholder="เหตุผลการส่งใหม่..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t justify-end">
              <button onClick={() => setResubmitCase(null)} className="btn-secondary">ยกเลิก</button>
              <button onClick={handleResubmit} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <RotateCcw size={15} /> {saving ? 'กำลังส่ง...' : 'ส่ง Finance ใหม่'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
