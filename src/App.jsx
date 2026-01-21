import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/Auth/AuthGuard'
import Dashboard from './components/Layout/Dashboard'
import ExtractionPage from './pages/ExtractionPage/ExtractionPage'
import ClientsPage from './pages/ClientsPage/ClientsPage'
import GroupsPage from './pages/GroupsPage/GroupsPage'
import GroupDetailsPage from './pages/GroupDetailsPage/GroupDetailsPage'
import TeamPage from './pages/TeamPage/TeamPage'

function App() {
  const [activeSection, setActiveSection] = useState('extraction')
  const [selectedGroupIds, setSelectedGroupIds] = useState([])

  const handleSectionChange = (section) => {
    setActiveSection(section)
    // Réinitialiser les groupes sélectionnés si on change de section
    if (section !== 'groups') {
      setSelectedGroupIds([])
    }
  }

  const handleOpenGroups = (groupIds) => {
    setSelectedGroupIds(Array.isArray(groupIds) ? groupIds : [groupIds])
  }

  const handleBackToGroups = () => {
    setSelectedGroupIds([])
  }

  const renderCurrentPage = () => {
    switch (activeSection) {
      case 'extraction':
        return <ExtractionPage />
      case 'clients':
        return <ClientsPage />
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
