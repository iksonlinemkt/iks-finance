import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { calcFinance, fmtNum, parseNum, generateCaseId } from '../utils/calc'
import { BRANCHES, BRANCH_CODES, FINANCE_LIST, INSURANCE_LIST, CAMPAIGN_LIST, OCCUPATION_LIST, COLOR_LIST, MODEL_LIST, SALES_LIST } from '../utils/dropdownData'
import SearchableSelect from '../components/SearchableSelect'
import { Save, Send, RefreshCw, FileImage, ChevronDown, ChevronUp } from 'lucide-react'
import html2canvas from 'html2canvas'

const initForm = {
  salesOrder: '', submitDate: new Date().toISOString().slice(0,10),
  branch: '', salesCode: '', salesName: '',
  finCode: '', finName: '', comFinance: '',
  customerName: '', customerPhone: '',
  modelNo: '', sellingName: '', carColor: '',
  carPrice: '', equipment: '', subDownAdd: '', discountCRP: '',
  downReal: '', discountDown: '', discountSubDown: '',
  interest: '', interestDiscount: '', term: '60',
  insurance: '', campaign: '', occupation: '',
  note: ''
}

export default function FinanceForm({ onSaved }) {
  const [form, setForm] = useState(initForm)
  const [calc, setCalc] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const pngRef = useRef(null)

  useEffect(() => {
    setCalc(calcFinance(form))
  }, [form])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSalesSelect = (code, opt) => {
    set('salesCode', code)
    if (opt) set('salesName', opt.name)
    if (opt && !form.branch) set('branch', opt.branch || '')
  }

  const handleFinSelect = (code, opt) => {
    set('finCode', code)
    if (opt) set('finName', opt.name)
  }

  const handleModelSelect = (no, opt) => {
    set('modelNo', no)
    if (opt) {
      set('sellingName', opt.model)
      set('carPrice', String(opt.crp))
    }
  }

  const handleSubmit = async () => {
    if (!form.customerName || !form.branch || !form.modelNo) {
      setMsg({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็น: ชื่อลูกค้า สาขา รุ่นรถ' })
      return
    }
    setSaving(true)
    try {
      const { data: existing } = await supabase.from('finance_cases').select('case_id')
      const branchCode = BRANCH_CODES[form.branch] || form.branch
      const caseId = generateCaseId(branchCode, existing || [])
      const c = calcFinance(form)

      const { error } = await supabase.from('finance_cases').insert({
        case_id: caseId,
        submit_date: form.submitDate,
        sales_order: form.salesOrder,
        branch: form.branch,
        sales_code: form.salesCode,
        sales_name: form.salesName,
        fin_code: form.finCode,
        fin_name: form.finName,
        com_finance: parseNum(form.comFinance),
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        model_no: form.modelNo,
        selling_name: form.sellingName,
        car_color: form.carColor,
        car_price: parseNum(form.carPrice),
        equipment: parseNum(form.equipment),
        sub_down_add: parseNum(form.subDownAdd),
        discount_crp: parseNum(form.discountCRP),
        total_car_price: c.totalCarPrice,
        down_real: parseNum(form.downReal),
        discount_down: parseNum(form.discountDown),
        discount_sub_down: parseNum(form.discountSubDown),
        total_down: c.totalDown,
        finance_amount: c.financeAmount,
        interest: parseNum(form.interest),
        interest_discount: parseNum(form.interestDiscount),
        real_interest: c.realInterest,
        term: parseNum(form.term),
        installment: c.installment,
        insurance: form.insurance,
        campaign: form.campaign,
        occupation: form.occupation,
        note: form.note,
        status: 'รับใบคำขอ',
        round: 1,
      })

      if (error) throw error
      setMsg({ type: 'success', text: `บันทึกสำเร็จ! รหัสเคส: ${caseId}` })
      setForm(initForm)
      if (onSaved) onSaved()
    } catch (e) {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleExportPNG = async () => {
    if (!pngRef.current) return
    const canvas = await html2canvas(pngRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const link = document.createElement('a')
    link.download = `finance-${form.customerName || 'case'}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const InputNum = ({ k, label, required, readOnly, highlight }) => (
    <div>
      <label className="form-label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {readOnly ? (
        <div className={`form-input ${highlight ? 'bg-brand-50 text-brand-700 font-semibold text-base' : 'bg-gray-50 text-gray-700 font-medium'}`}>
          {calc[k] !== undefined ? fmtNum(calc[k]) : '-'}
        </div>
      ) : (
        <input
          type="number"
          value={form[k] || ''}
          onChange={e => set(k, e.target.value)}
          className="form-input"
          placeholder="0"
        />
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? '✅' : '❌'} {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Section 1: ข้อมูลการส่ง */}
      <div className="card">
        <div className="section-title">
          <span className="bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          ข้อมูลการส่งสินเชื่อ
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">วันที่ส่ง <span className="text-red-500">*</span></label>
            <input type="date" value={form.submitDate} onChange={e => set('submitDate', e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">สาขา <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={BRANCHES.map(b => ({ label: b, value: b }))}
              value={form.branch} onChange={v => set('branch', v)}
              placeholder="เลือกสาขา" displayKey="label" valueKey="value"
            />
          </div>
          <div>
            <label className="form-label">รหัสเซลส์</label>
            <SearchableSelect
              options={SALES_LIST} value={form.salesCode}
              onChange={handleSalesSelect}
              placeholder="ค้นหารหัส/ชื่อ..." displayKey="code" valueKey="code"
              searchKeys={['code', 'name']}
              label={o => <div><span className="font-semibold text-brand-600">{o.code}</span><span className="text-gray-500 ml-2 text-xs">{o.name}</span></div>}
            />
          </div>
          <div className="col-span-1 flex justify-end items-start">
            <div className="w-full">
              <label className="form-label">Sales Order (ไม่เกิน 10 ตัว)</label>
              <input
                type="text" maxLength={10} value={form.salesOrder}
                onChange={e => set('salesOrder', e.target.value)}
                className="form-input" placeholder="SO-XXXXXXXX"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="form-label">ชื่อที่ปรึกษาการขาย</label>
            <SearchableSelect
              options={SALES_LIST} value={form.salesCode}
              onChange={handleSalesSelect}
              placeholder="ค้นหาชื่อที่ปรึกษา..." displayKey="name" valueKey="code"
              searchKeys={['code', 'name']}
              label={o => <div><span className="font-semibold text-brand-600">{o.code}</span><span className="text-gray-500 ml-2">{o.name}</span><span className="text-gray-400 ml-2 text-xs">{o.branch}</span></div>}
            />
          </div>
          <div>
            <label className="form-label">ไฟแนนซ์ <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={FINANCE_LIST} value={form.finCode}
              onChange={handleFinSelect}
              placeholder="เลือกไฟแนนซ์..." displayKey="code" valueKey="code"
              label={o => <div><span className="font-semibold text-brand-600 w-16 inline-block">{o.code}</span><span className="text-gray-600 text-xs ml-2">{o.name}</span></div>}
            />
          </div>
          <div>
            <label className="form-label">ชื่อบริษัทไฟแนนซ์</label>
            <input value={form.finName} readOnly className="form-input bg-gray-50" placeholder="จะแสดงเมื่อเลือกไฟแนนซ์" />
          </div>
          <div>
            <label className="form-label">Com Finance (บาท)</label>
            <input
              type="number" value={form.comFinance}
              onChange={e => set('comFinance', e.target.value)}
              className="form-input" placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Section 2: ข้อมูลลูกค้า */}
      <div className="card">
        <div className="section-title">
          <span className="bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          ข้อมูลลูกค้า
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">ชื่อลูกค้า <span className="text-red-500">*</span></label>
            <input type="text" value={form.customerName} onChange={e => set('customerName', e.target.value)} className="form-input" placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <label className="form-label">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input type="tel" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} className="form-input" placeholder="0XX-XXX-XXXX" />
          </div>
        </div>
      </div>

      {/* Section 3: ข้อมูลรถ */}
      <div className="card">
        <div className="section-title">
          <span className="bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          ข้อมูลรถ
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">รุ่นรถ / Model Code <span className="text-red-500">*</span></label>
            <SearchableSelect
              options={MODEL_LIST} value={form.modelNo}
              onChange={handleModelSelect}
              placeholder="ค้นหา Model Code..." displayKey="no" valueKey="no"
              searchKeys={['no', 'model']}
              label={o => <div><span className="font-semibold text-brand-600 w-16 inline-block">{o.no}</span><span className="text-gray-600 text-xs ml-2">{o.model}</span></div>}
            />
          </div>
          <div>
            <label className="form-label">Selling Name</label>
            <SearchableSelect
              options={MODEL_LIST} value={form.modelNo}
              onChange={handleModelSelect}
              placeholder="ค้นหา Selling Name..." displayKey="model" valueKey="no"
              searchKeys={['no', 'model']}
            />
          </div>
          <div>
            <label className="form-label">สีรถ</label>
            <SearchableSelect
              options={COLOR_LIST.map(c => ({ label: c, value: c }))}
              value={form.carColor} onChange={v => set('carColor', v)}
              placeholder="เลือกสี..." displayKey="label" valueKey="value"
            />
          </div>
        </div>
      </div>

      {/* Section 4: ราคา */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ราคารถ */}
          <div>
            <div className="section-title">
              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              ราคารถ
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">ราคารถ <span className="text-red-500">*</span></label>
                <input type="number" value={form.carPrice} onChange={e => set('carPrice', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">ราคาอุปกรณ์</label>
                <input type="number" value={form.equipment} onChange={e => set('equipment', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">บวก Sub Down</label>
                <input type="number" value={form.subDownAdd} onChange={e => set('subDownAdd', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">ลดราคา CRP</label>
                <input type="number" value={form.discountCRP} onChange={e => set('discountCRP', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <label className="form-label text-blue-700 font-semibold">ราคารถรวม</label>
                <div className="text-blue-700 font-bold text-xl">{fmtNum(calc.totalCarPrice) || '-'}</div>
              </div>
            </div>
          </div>

          {/* เงินดาวน์ */}
          <div>
            <div className="section-title">
              <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
              เงินดาวน์
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">เงินดาวน์จริง <span className="text-red-500">*</span></label>
                <input type="number" value={form.downReal} onChange={e => set('downReal', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">ลดดาวน์</label>
                <input type="number" value={form.discountDown} onChange={e => set('discountDown', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">ลด Sub Down</label>
                <input type="number" value={form.discountSubDown} onChange={e => set('discountSubDown', e.target.value)} className="form-input" placeholder="0" />
              </div>
              <div className="pt-3">
                <label className="form-label text-xs text-gray-400">% ดาวน์จากเงินจริง</label>
                <div className="text-gray-500 text-sm">{calc.downPercentReal ? calc.downPercentReal.toFixed(1) + '%' : '-'}</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <label className="form-label text-emerald-700 font-semibold">รวมเงินดาวน์</label>
                <div className="text-emerald-700 font-bold text-xl">{fmtNum(calc.totalDown) || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: รายละเอียดค่างวด */}
      <div className="card">
        <div className="section-title">
          <span className="bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
          รายละเอียดค่างวด
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">ยอดจัด</label>
            <div className="form-input bg-gray-50 font-semibold text-gray-700">{fmtNum(calc.financeAmount) || '-'}</div>
          </div>
          <div>
            <label className="form-label">ดอกเบี้ย (%)</label>
            <input type="number" step="0.01" value={form.interest} onChange={e => set('interest', e.target.value)} className="form-input" placeholder="0.00" />
          </div>
          <div>
            <label className="form-label">ส่วนลดดอกเบี้ย (%)</label>
            <input type="number" step="0.01" value={form.interestDiscount} onChange={e => set('interestDiscount', e.target.value)} className="form-input" placeholder="0.00" />
          </div>
          <div>
            <label className="form-label">ดอกเบี้ยจริง (%)</label>
            <div className="form-input bg-gray-50 font-medium">{calc.realInterest !== undefined ? calc.realInterest.toFixed(2) + '%' : '-'}</div>
          </div>
          <div>
            <label className="form-label">% ค่าคอม</label>
            <input type="number" value={form.comPct} onChange={e => set('comPct', e.target.value)} className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">จำนวนงวด</label>
            <input type="number" value={form.term} onChange={e => set('term', e.target.value)} className="form-input" placeholder="60" />
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="form-label font-semibold text-brand-700">ค่างวดต่อเดือน</label>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-center">
              <span className="text-brand-700 font-bold text-2xl">{fmtNum(calc.installment) || '-'}</span>
              <span className="text-brand-500 text-sm ml-1">บาท</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: รายละเอียดเพิ่มเติม */}
      <div className="card">
        <div className="section-title">
          <span className="bg-brand-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">7</span>
          รายละเอียดเพิ่มเติมของลูกค้า
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">ประกันภัย</label>
            <SearchableSelect
              options={INSURANCE_LIST.map(v => ({ label: v, value: v }))}
              value={form.insurance} onChange={v => set('insurance', v)}
              placeholder="เลือกประกันภัย..." displayKey="label" valueKey="value"
            />
          </div>
          <div>
            <label className="form-label">แคมเปญดอกเบี้ย</label>
            <SearchableSelect
              options={CAMPAIGN_LIST.map(v => ({ label: v, value: v }))}
              value={form.campaign} onChange={v => set('campaign', v)}
              placeholder="เลือกแคมเปญ..." displayKey="label" valueKey="value"
            />
          </div>
          <div>
            <label className="form-label">อาชีพ</label>
            <SearchableSelect
              options={OCCUPATION_LIST.map(v => ({ label: v, value: v }))}
              value={form.occupation} onChange={v => set('occupation', v)}
              placeholder="เลือกอาชีพ..." displayKey="label" valueKey="value"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="form-label">หมายเหตุ</label>
          <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)} className="form-input resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <button onClick={() => { setForm(initForm); setMsg(null) }} className="btn-secondary">
          <RefreshCw size={16} /> ล้างข้อมูล
        </button>
        <div className="flex gap-3">
          <button onClick={handleExportPNG} className="btn-secondary">
            <FileImage size={16} /> ส่งไฟแนนซ์ (PNG)
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>

      {/* Hidden PNG template */}
      <div className="fixed -top-[9999px] left-0">
        <div ref={pngRef} style={{ width: 600, padding: 32, background: '#fff', fontFamily: 'Sarabun, sans-serif' }}>
          <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>IKS Finance — ใบคำขอสินเชื่อ</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>วันที่: {form.submitDate}</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            {[
              ['ชื่อลูกค้า', form.customerName],
              ['เบอร์โทรศัพท์', form.customerPhone],
              ['ชื่อที่ปรึกษา', form.salesName],
              ['สาขา', form.branch],
              ['ราคารถรวม', fmtNum(calc.totalCarPrice) + ' บาท'],
              ['รวมเงินดาวน์', fmtNum(calc.totalDown) + ' บาท'],
              ['ดอกเบี้ยจริง', (calc.realInterest || 0).toFixed(2) + '%'],
              ['จำนวนงวด', form.term + ' งวด'],
              ['อาชีพ', form.occupation],
            ].map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#475569', width: '40%' }}>{k}</td>
                <td style={{ padding: '8px 12px', color: '#0f172a' }}>{v || '-'}</td>
              </tr>
            ))}
          </table>
          <div style={{ marginTop: 16, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
            IKS Finance System — สงวนสิทธิ์ข้อมูล
          </div>
        </div>
      </div>
    </div>
  )
}
