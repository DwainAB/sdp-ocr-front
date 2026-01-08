import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmationModal from '../Modals/ConfirmationModal'
import './Dashboard.css'

const Dashboard = ({ children, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth()
  const [showClientsSubmenu, setShowClientsSubmenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>SDP OCR</h1>
          <p>Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'extraction' ? 'active' : ''}`}
            onClick={() => onSectionChange('extraction')}
          >
            <div className="nav-item-content">
              <span className="nav-icon">📄</span>
              <span className="nav-text">Extraction de données</span>
            </div>
          </button>

          <div className="nav-item-container">
            <button
              className={`nav-item ${activeSection === 'clients' || activeSection === 'groups' || activeSection === 'analysis' ? 'active' : ''}`}
              onClick={() => {
                setShowClientsSubmenu(!showClientsSubmenu)
                if (!showClientsSubmenu) {
                  onSectionChange('clients')
                }
              }}
            >
              <div className="nav-item-content">
                <span className="nav-icon">👥</span>
                <span className="nav-text">Base de données clients</span>
              </div>
              <span className={`submenu-arrow ${showClientsSubmenu ? 'open' : ''}`}>▼</span>
            </button>

            {showClientsSubmenu && (
              <div className="submenu">
                <button
                  className={`submenu-item ${activeSection === 'clients' ? 'active' : ''}`}
                  onClick={() => onSectionChange('clients')}
                >
                  <div className="submenu-item-content">
                    <span className="submenu-icon">📋</span>
                    <span className="submenu-text">Liste des clients</span>
                  </div>
                </button>
                <button
                  className={`submenu-item ${activeSection === 'groups' ? 'active' : ''}`}
                  onClick={() => onSectionChange('groups')}
                >
                  <div className="submenu-item-content">
                    <span className="submenu-icon">👨‍👩‍👧‍👦</span>
                    <span className="submenu-text">Groupe</span>
                  </div>
                </button>
                <button
                  className={`submenu-item ${activeSection === 'analysis' ? 'active' : ''}`}
                  onClick={() => onSectionChange('analysis')}
                >
                  <div className="submenu-item-content">
                    <span className="submenu-icon">📊</span>
                    <span className="submenu-text">Analyse</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            className={`nav-item ${activeSection === 'team' ? 'active' : ''}`}
            onClick={() => onSectionChange('team')}
          >
            <div className="nav-item-content">
              <span className="nav-icon">👨‍💼</span>
              <span className="nav-text">Équipe</span>
            </div>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'Utilisateur'}</p>
              <p className="user-email">{user?.email || ''}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        isLoading={isLoggingOut}
      />
    </div>
  )
}

export default Dashboard