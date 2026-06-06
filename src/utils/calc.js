// Finance calculation utilities

export const fmtNum = (n) => {
  if (n === null || n === undefined || n === '' || isNaN(n)) return ''
  return Math.round(Number(n)).toLocaleString('th-TH')
}

export const fmtCurrency = (n) => {
  if (!n || isNaN(n)) return '-'
  return Math.round(Number(n)).toLocaleString('th-TH')
}

export const parseNum = (v) => {
  if (v === null || v === undefined || v === '') return 0
  return parseFloat(String(v).replace(/,/g, '')) || 0
}

export const calcFinance = (form) => {
  const carPrice = parseNum(form.carPrice)
  const equipment = parseNum(form.equipment)
  const subDownAdd = parseNum(form.subDownAdd)
  const discountCRP = parseNum(form.discountCRP)
  const downReal = parseNum(form.downReal)
  const discountDown = parseNum(form.discountDown)
  const discountSubDown = parseNum(form.discountSubDown)
  const interest = parseNum(form.interest)
  const interestDiscount = parseNum(form.interestDiscount)
  const term = parseNum(form.term) || 60

  const totalCarPrice = carPrice + equipment + subDownAdd - discountCRP
  const totalDown = downReal + discountDown + discountSubDown
  const financeAmount = Math.max(totalCarPrice - totalDown, 0)
  const realInterest = Math.max(interest - interestDiscount, 0)
  const totalInterest = financeAmount * (realInterest / 100) * (term / 12)
  const installment = term > 0 ? (financeAmount + totalInterest) / term : 0
  const downPercentReal = totalCarPrice > 0 ? (downReal / totalCarPrice) * 100 : 0
  const downPercentTotal = totalCarPrice > 0 ? (totalDown / totalCarPrice) * 100 : 0

  return {
    totalCarPrice,
    totalDown,
    financeAmount,
    realInterest,
    installment: Math.round(installment),
    downPercentReal,
    downPercentTotal,
  }
}

export const getDownRange = (pct) => {
  if (pct < 5) return '<5%'
  if (pct < 10) return '5%'
  if (pct < 15) return '10%'
  if (pct < 20) return '15%'
  if (pct < 25) return '20%'
  if (pct < 30) return '25%'
  if (pct < 40) return '30%'
  return '40%+'
}

export const DOWN_RANGES = ['5%', '10%', '15%', '20%', '25%', '30%', '40%+']

export const generateCaseId = (branchCode, existingCases = []) => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `${branchCode}${yy}${mm}`
  const existing = existingCases
    .filter(c => c.case_id && c.case_id.startsWith(prefix))
    .map(c => parseInt(c.case_id.slice(-3)) || 0)
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
