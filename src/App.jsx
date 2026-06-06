import { useState } from 'react'
import Layout from './components/Layout'
import FinanceForm from './pages/FinanceForm'
import CaseList from './pages/CaseList'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [tab, setTab] = useState('form')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSaved = () => {
    setRefreshKey(k => k + 1)
    setTab('cases')
  }

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === 'form'      && <FinanceForm onSaved={handleSaved} />}
      {tab === 'cases'     && <CaseList key={refreshKey} />}
      {tab === 'dashboard' && <Dashboard />}
    </Layout>
  )
}
