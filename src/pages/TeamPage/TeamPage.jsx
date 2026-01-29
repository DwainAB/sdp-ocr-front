import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { formatLastLogin } from '../../utils/timeUtils'
import AddUserModal from '../../components/Modals/AddUserModal/AddUserModal'
import UserLoginHistoryModal from '../../components/Modals/UserLoginHistoryModal/UserLoginHistoryModal'
import UserDetailsModal from '../../components/Modals/UserDetailsModal/UserDetailsModal'
import RolesManagementModal from '../../components/Modals/RolesManagementModal/RolesManagementModal'
import { usersApi } from '../../services/api'
import './TeamPage.css'

const TeamPage = () => {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRolesModal, setShowRolesModal] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let data

      if (showOnlineOnly) {
        data = await usersApi.getOnline()
      } else if (selectedTeam) {
        data = await usersApi.getByTeam(selectedTeam)
      } else if (selectedRole) {
        data = await usersApi.getByRole(selectedRole)
      } else {
        data = await usersApi.getAll()
      }

      setTeamMembers(data.users || data || [])
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error)
      setError('Erreur lors du chargement de l\'équipe')
    } finally {
      setIsLoading(false)
    }
  }



  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchTerm === '' ||
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getUniqueRoles = () => {
    const roles = teamMembers.map(member => member.role).filter(Boolean)
    return [...new Set(roles)].sort()
  }

  const getUniqueTeams = () => {
    const teams = teamMembers.map(member => member.team).filter(Boolean)
    return [...new Set(teams)].sort()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedRole('')
    setSelectedTeam('')
    setShowOnlineOnly(false)
  }

  const handleAddMember = () => {
    setShowAddModal(true)
  }

  const handleUserAdded = (newUser) => {
    // Actualiser la liste des membres après ajout
    fetchTeamMembers()
  }

  const handleViewLogs = (user) => {
    setSelectedUserForHistory(user)
    setShowLoginHistoryModal(true)
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const handleUserUpdated = (updatedUser) => {
    // Mettre à jour la liste des utilisateurs
    setTeamMembers(prev => prev.map(user =>
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user
    ))
    // Optionnel: recharger pour être sûr d'avoir les dernières données
    fetchTeamMembers()
  }


  useEffect(() => {
    fetchTeamMembers()
  }, [showOnlineOnly, selectedTeam, selectedRole])

  // Mettre à jour l'affichage du temps relatif toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, 60000) // 60 secondes

    return () => clearInterval(interval)
  }, [])

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'actif':
        return 'status-active'
      case 'en congé':
        return 'status-leave'
      case 'inactif':
        return 'status-inactive'
      default:
        return 'status-default'
    }
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2>Équipe</h2>
          <p>Gestion des membres de l'équipe ({filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''} sur {teamMembers.length})</p>
        </div>
        <div className="header-actions">
          {user?.role?.full_access && (
            <>
              <button className="action-btn roles-btn" onClick={() => setShowRolesModal(true)}>
                <span className="btn-icon">⚙</span>
                <span className="btn-tooltip">Gestion des rôles</span>
              </button>
              <button className="action-btn add-btn" onClick={handleAddMember}>
                <span className="btn-icon">+</span>
                <span className="btn-tooltip">Ajouter un membre</span>
              </button>
            </>
          )}
          <button className="action-btn refresh-btn" onClick={fetchTeamMembers}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Rechercher par nom, email ou rôle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dropdown-filters">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les rôles</option>
              {getUniqueRoles().map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les équipes</option>
              {getUniqueTeams().map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>

            <label className="online-filter">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
              />
              Utilisateurs en ligne uniquement
            </label>

            <button className="reset-filters-btn" onClick={resetFilters}>
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="file-status">
          <div className="status-indicator error">
            ❌ {error}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement de l'équipe...
          </span>
        </div>
      ) : (
        <div className="team-grid">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="member-card clickable-card"
              onClick={() => handleViewUser(member)}
            >
              <div className="member-header">
                <div className="member-avatar">
                  {member.avatar ? (
                    <img src={member.avatar} alt={`${member.first_name} ${member.last_name}`} />
                  ) : (
                    <span className="avatar-initials">
                      {getInitials(member.first_name, member.last_name)}
                    </span>
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name-status">
                    <h3>{member.first_name} {member.last_name}</h3>
                    <div className={`status-dot ${member.is_online ? 'online' : 'offline'}`}
                         title={member.is_online ? 'En ligne' : 'Hors ligne'}>
                    </div>
                  </div>
                  <p className="member-role">{member.role}</p>
                  <span className={`status-badge ${getStatusColor(member.job)}`}>
                    {member.job}
                  </span>
                </div>
              </div>

              <div className="member-details">
                <div className="detail-item">
                  <span className="detail-icon">📧</span>
                  <span className="detail-text">{member.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📞</span>
                  <span className="detail-text">{member.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🏢</span>
                  <span className="detail-text">{member.team}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🕒</span>
                  <span className={`detail-text ${member.is_online ? 'status-online' : 'status-offline'}`}>
                    {formatLastLogin(member.last_login_at, member.is_online)}
                  </span>
                </div>
              </div>

              <div className="member-actions">
                <button
                  className="email-member-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`mailto:${member.email}`, '_blank')
                  }}
                >
                  📧 Mail
                </button>
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && teamMembers.length > 0 && (
            <div className="empty-state">
              <p>Aucun membre ne correspond aux critères de recherche</p>
            </div>
          )}

          {teamMembers.length === 0 && !isLoading && (
            <div className="empty-state">
              <p>Aucun membre d'équipe trouvé</p>
            </div>
          )}
        </div>
      )}

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      <UserLoginHistoryModal
        isOpen={showLoginHistoryModal}
        onClose={() => setShowLoginHistoryModal(false)}
        user={selectedUserForHistory}
      />

      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
        onViewLogs={handleViewLogs}
      />

      <RolesManagementModal
        isOpen={showRolesModal}
        onClose={() => setShowRolesModal(false)}
        onRolesUpdated={fetchTeamMembers}
      />
    </div>
  )
}

export default TeamPage