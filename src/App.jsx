import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/Auth/AuthGuard'
import Dashboard from './components/Layout/Dashboard'
import ExtractionPage from './pages/ExtractionPage/ExtractionPage'
import ClientsPage from './pages/ClientsPage/ClientsPage'
import CustomerDetailsPage from './pages/CustomerDetailsPage/CustomerDetailsPage'
import FormulaDetailsPage from './pages/FormulaDetailsPage/FormulaDetailsPage'
import GroupsPage from './pages/GroupsPage/GroupsPage'
import GroupDetailsPage from './pages/GroupDetailsPage/GroupDetailsPage'
import TeamPage from './pages/TeamPage/TeamPage'

function App() {
  const [activeSection, setActiveSection] = useState('extraction')
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedFormulaId, setSelectedFormulaId] = useState(null)

  const handleSectionChange = (section) => {
    setActiveSection(section)
    // Réinitialiser les groupes sélectionnés si on change de section
    if (section !== 'groups') {
      setSelectedGroupIds([])
    }
    // Réinitialiser le client et la formule sélectionnés si on change de section
    if (section !== 'clients') {
      setSelectedCustomerId(null)
      setSelectedFormulaId(null)
    }
  }

  const handleOpenGroups = (groupIds) => {
    setSelectedGroupIds(Array.isArray(groupIds) ? groupIds : [groupIds])
  }

  const handleBackToGroups = () => {
    setSelectedGroupIds([])
  }

  const handleOpenCustomer = (customerId) => {
    setSelectedCustomerId(customerId)
    setSelectedFormulaId(null)
  }

  const handleBackToClients = () => {
    setSelectedCustomerId(null)
    setSelectedFormulaId(null)
  }

  const handleOpenFormula = (formulaId) => {
    setSelectedFormulaId(formulaId)
  }

  const handleBackToCustomer = () => {
    setSelectedFormulaId(null)
  }

  const renderCurrentPage = () => {
    switch (activeSection) {
      case 'extraction':
        return <ExtractionPage />
      case 'clients':
        if (selectedFormulaId) {
          return (
            <FormulaDetailsPage
              formulaId={selectedFormulaId}
              customerId={selectedCustomerId}
              onBack={handleBackToCustomer}
            />
          )
        }
        if (selectedCustomerId) {
          return (
            <CustomerDetailsPage
              customerId={selectedCustomerId}
              onBack={handleBackToClients}
              onOpenFormula={handleOpenFormula}
            />
          )
        }
        return <ClientsPage onOpenCustomer={handleOpenCustomer} />
      case 'groups':
        return selectedGroupIds.length > 0
          ? <GroupDetailsPage groupIds={selectedGroupIds} onBack={handleBackToGroups} />
          : <GroupsPage onOpenGroups={handleOpenGroups} />
      case 'analysis':
        return <div className="section-content"><div className="section-header"><h2>Analyse</h2><p>Page d'analyse en cours de développement</p></div></div>
      case 'team':
        return <TeamPage />
      default:
        return <ExtractionPage />
    }
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AuthGuard>
          <Dashboard
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          >
            {renderCurrentPage()}
          </Dashboard>
        </AuthGuard>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
