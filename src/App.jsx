import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/Auth/AuthGuard'
import Dashboard from './components/Layout/Dashboard'
import ExtractionPage from './pages/ExtractionPage'
import ClientsPage from './pages/ClientsPage'
import TeamPage from './pages/TeamPage'

function App() {
  const [activeSection, setActiveSection] = useState('extraction')

  const handleSectionChange = (section) => {
    setActiveSection(section)
  }

  const renderCurrentPage = () => {
    switch (activeSection) {
      case 'extraction':
        return <ExtractionPage />
      case 'clients':
        return <ClientsPage />
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
