import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './Dashboard.css'

const Dashboard = ({ children, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout()
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
            <span className="nav-icon">📄</span>
            Extraction de données
          </button>

          <button
            className={`nav-item ${activeSection === 'clients' ? 'active' : ''}`}
            onClick={() => onSectionChange('clients')}
          >
            <span className="nav-icon">👥</span>
            Base de données clients
          </button>

          <button
            className={`nav-item ${activeSection === 'team' ? 'active' : ''}`}
            onClick={() => onSectionChange('team')}
          >
            <span className="nav-icon">👨‍💼</span>
            Équipe
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'Utilisateur'}</p>
              <p className="user-email">{user?.email || ''}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

export default Dashboard