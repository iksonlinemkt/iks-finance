import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDownRange, DOWN_RANGES } from '../utils/calc'
import { BRANCHES, BRANCH_CODES } from '../utils/dropdownData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { TrendingUp, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

const BRANCH_COLORS = { 'บางนา': '#3b82f6', 'ศรีนครินทร์': '#10b981', 'บางเสาธง': '#f59e0b', 'เกษตร': '#f97316', 'IKS': '#374151' }
const STATUS_COLORS = { 'รับใบคำขอ': '#3b82f6', 'ส่ง Finance': '#f59e0b', 'ขอเอกสารเพิ่มเติม': '#f97316', 'รอผล': '#8b5cf6', 'ปรับเงื่อนไข': '#06b6d4', 'อนุมัติ': '#10b981', 'อนุมัติแบบปรับเงื่อนไข': '#059669', 'ไม่อนุมัติ': '#ef4444' }
const BRANCH_LIST = ['บางนา', 'ศรีนครินทร์', 'บางเสาธง', 'เกษตร']

export default function Dashboard() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ preset: 'this_month', from: '', to: '', branch: '', sales: '' })

  useEffect(() => { fetchCases() }, [])

  const fetchCases = async () => {
    setLoading(true)
    const { data } = await supabase.from('finance_cases').select('*')
    setCases(data || [])
    setLoading(false)
  }

  const getDateRange = () => {
    const now = new Date()
    if (filters.preset === 'this_month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    if (filters.preset === 'last_month') return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) }
    if (filters.preset === 'this_quarter') { const q = Math.floor(now.getMonth() / 3); return { from: new Date(now.getFullYear(), q * 3, 1), to: now } }
    if (filters.preset === 'this_year') return { from: new Date(now.getFullYear(), 0, 1), to: now }
    if (filters.preset === 'custom') return { from: filters.from ? new Date(filters.from) : null, to: filters.to ? new Date(filters.to) : null }
    return { from: null, to: null }
  }

  const filtered = cases.filter(c => {
    const { from, to } = getDateRange()
    const d = c.submit_date ? new Date(c.submit_date) : null
    if (from && d && d < from) return false
    if (to && d && d > to) return false
    if (filters.branch && c.branch !== filters.branch) return false
    if (filters.sales && c.sales_code !== filters.sales) return false
    return true
  })

  const total = filtered.length
  const approved = filtered.filter(c => c.status === 'อนุมัติ' || c.status === 'อนุมัติแบบปรับเงื่อนไข').length
  const rejected = filtered.filter(c => c.status === 'ไม่อนุมัติ').length
  const pending = filtered.filter(c => ['รับใบคำขอ', 'ส่ง Finance', 'รอผล', 'ขอเอกสารเพิ่มเติม', 'ปรับเงื่อนไข'].includes(c.status)).length
  const approvalRate = (approved + rejected) > 0 ? Math.round(approved / (approved + rejected) * 100) : 0

  // Status donut
  const statusData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  // Finance bar
  const finData = Object.entries(
    filtered.reduce((acc, c) => { if (c.fin_code) { acc[c.fin_code] = (acc[c.fin_code] || 0) + 1 } return acc }, {})
  ).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  // Avg days to approve
  const approvedCases = filtered.filter(c => c.status === 'อนุมัติ' && c.submit_date && c.updated_at)
  const avgDaysData = BRANCH_LIST.map(b => {
    const bc = approvedCases.filter(c => c.branch === b)
    const avg = bc.length > 0 ? Math.round(bc.reduce((s, c) => s + Math.abs(new Date(c.updated_at) - new Date(c.submit_date)) / 86400000, 0) / bc.length) : 0
    return { name: b, วัน: avg }
  })

  // Down % grouped bar
  const buildDownChart = (field) => {
    const result = {}
    DOWN_RANGES.forEach(r => { result[r] = { range: r, 'บางนา': 0, 'ศรีนครินทร์': 0, 'บางเสาธง': 0, 'เกษตร': 0, 'IKS': 0 } })
    filtered.forEach(c => {
      const pct = field === 'real' ? (c.down_real && c.total_car_price ? (c.down_real / c.total_car_price * 100) : 0) : (c.total_down && c.total_car_price ? (c.total_down / c.total_car_price * 100) : 0)
      const range = getDownRange(pct)
      if (result[range]) {
        const br = c.branch || ''
        if (BRANCH_LIST.includes(br)) result[range][br]++
        result[range]['IKS']++
      }
    })
    return Object.values(result)
  }

  const downRealData = buildDownChart('real')
  const downTotalData = buildDownChart('total')

  const KPICard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label text-xs">ช่วงเวลา</label>
            <select value={filters.preset} onChange={e => setFilters(p => ({ ...p, preset: e.target.value }))} className="form-select w-44">
              <option value="all">ทั้งหมด</option>
              <option value="this_month">เดือนนี้</option>
              <option value="last_month">เดือนที่แล้ว</option>
              <option value="this_quarter">ไตรมาสนี้</option>
              <option value="this_year">ปีนี้</option>
              <option value="custom">กำหนดเอง</option>
            </select>
          </div>
          {filters.preset === 'custom' && <>
            <div>
              <label className="form-label text-xs">จาก</label>
              <input type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} className="form-input w-40" />
            </div>
            <div>
              <label className="form-label text-xs">ถึง</label>
              <input type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} className="form-input w-40" />
            </div>
          </>}
          <div>
            <label className="form-label text-xs">สาขา</label>
            <select value={filters.branch} onChange={e => setFilters(p => ({ ...p, branch: e.target.value }))} className="form-select w-36">
              <option value="">ทุกสาขา</option>
              {BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button onClick={fetchCases} className="btn-primary h-9 text-sm">
            <Filter size={14} /> แสดงผล
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp} label="เคสทั้งหมด" value={total} color="bg-brand-600" />
        <KPICard icon={CheckCircle} label="อนุมัติ" value={approved} sub={`${approvalRate}% approval rate`} color="bg-emerald-500" />
        <KPICard icon={XCircle} label="ไม่อนุมัติ" value={rejected} sub={`${total > 0 ? Math.round(rejected/total*100) : 0}%`} color="bg-red-500" />
        <KPICard icon={Clock} label="รอผล" value={pending} color="bg-amber-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-display font-semibold text-gray-800 mb-4">ระยะเวลาเฉลี่ย (วัน) ส่ง→อนุมัติ</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgDaysData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="วัน" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-gray-800 mb-4">สัดส่วนสถานะ</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' เคส', n]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="card">
        <h3 className="font-display font-semibold text-gray-800 mb-4">สัดส่วนการส่งแต่ละ Finance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={finData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="จำนวนเคส" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Down % Charts */}
      {[
        { title: '% ดาวน์จาก เงินดาวน์จริง', data: downRealData },
        { title: '% ดาวน์จาก รวมเงินดาวน์', data: downTotalData },
      ].map(({ title, data }) => (
        <div key={title} className="card">
          <h3 className="font-display font-semibold text-gray-800 mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {['บางนา', 'ศรีนครินทร์', 'บางเสาธง', 'เกษตร', 'IKS'].map(b => (
                <Bar key={b} dataKey={b} fill={BRANCH_COLORS[b]} radius={[3, 3, 0, 0]} maxBarSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
