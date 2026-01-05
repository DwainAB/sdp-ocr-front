import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AddGroupModal from '../components/Modals/AddGroupModal'
import GroupMembersModal from '../components/Modals/GroupMembersModal'
import './GroupsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const GroupsPage = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGroups, setFilteredGroups] = useState([])

  useEffect(() => {
    fetchGroups()
  }, [])

  // Filtrage des groupes
  useEffect(() => {
    let filtered = groups.filter(group => {
      const matchesSearch = searchTerm === '' ||
        group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })

    setFilteredGroups(filtered)
  }, [groups, searchTerm])

  const fetchGroupMemberCount = async (groupId) => {
    try {
      // Récupérer tous les clients
      const response = await fetch(`${API_URL}/api/v1/customers/`)

      if (!response.ok) {
        return 0
      }

      const data = await response.json()
      const allClients = data.customers || []
      let memberCount = 0

      // Pour chaque client, vérifier s'il appartient au groupe
      for (const client of allClients) {
        try {
          const groupResponse = await fetch(`${API_URL}/api/v1/groups/customer/${client.id}`)

          if (groupResponse.ok) {
            const clientGroups = await groupResponse.json()
            // Vérifier si le client appartient au groupe
            const belongsToGroup = clientGroups.groups && clientGroups.groups.some(g => g.id === groupId)

            if (belongsToGroup) {
              memberCount++
            }
          }
        } catch (clientError) {
          // Ignorer les erreurs individuelles
        }
      }

      return memberCount
    } catch (error) {
      console.warn('Erreur lors du comptage des membres:', error)
      return 0
    }
  }

  const fetchGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/groups/`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      const groupsList = data.groups || data || []

      // Calculer le nombre de membres pour chaque groupe
      const groupsWithMemberCount = await Promise.all(
        groupsList.map(async (group) => {
          const memberCount = await fetchGroupMemberCount(group.id)
          return {
            ...group,
            member_count: memberCount
          }
        })
      )

      setGroups(groupsWithMemberCount)
      setError(null)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
      setError('Erreur lors du chargement des groupes')
      setGroups([])
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleAddGroup = () => {
    setShowAddModal(true)
  }

  const handleGroupAdded = async (newGroup) => {
    // Calculer le nombre de membres pour le nouveau groupe
    const memberCount = await fetchGroupMemberCount(newGroup.id)
    const groupWithMemberCount = {
      ...newGroup,
      member_count: memberCount
    }

    setGroups(prev => [groupWithMemberCount, ...prev])
    setShowAddModal(false)
  }

  const handleViewMembers = (group) => {
    setSelectedGroup(group)
    setShowMembersModal(true)
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      // Retirer le groupe de la liste locale
      setGroups(prev => prev.filter(group => group.id !== groupId))
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error)
      setError('Erreur lors de la suppression du groupe')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2>Gestion des groupes</h2>
          <p>
            Organisation et gestion des groupes de clients ({filteredGroups.length} groupe
            {filteredGroups.length !== 1 ? 's' : ''} sur {groups.length})
          </p>
        </div>
        <div className="header-actions">
          <button className="add-group-btn" onClick={handleAddGroup}>
            ➕ Ajouter un groupe
          </button>
          <button className="refresh-btn" onClick={fetchGroups}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        <div className="file-status">
          <div className="status-indicator error">
            ❌ {error}
          </div>
        </div>
      )}

      {isLoadingGroups ? (
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des groupes...
          </span>
        </div>
      ) : (
        <div className="groups-container">
          {filteredGroups.length === 0 && groups.length > 0 && searchTerm && (
            <div className="empty-state">
              <p>Aucun groupe ne correspond aux critères de recherche</p>
            </div>
          )}

          {filteredGroups.length === 0 && groups.length === 0 && !isLoadingGroups && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>Aucun groupe trouvé</h3>
              <p>Commencez par créer votre premier groupe de clients</p>
              <button className="add-group-btn" onClick={handleAddGroup}>
                ➕ Créer un groupe
              </button>
            </div>
          )}

          <div className="groups-grid">
            {filteredGroups.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-header">
                  <h3 className="group-name">{group.name}</h3>
                  <div className="group-actions">
                    <button
                      className="action-btn edit-btn"
                      title="Modifier le groupe"
                      onClick={() => console.log('Edit group', group.id)}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      title="Supprimer le groupe"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="group-description">
                  <p>{group.description || 'Aucune description'}</p>
                </div>

                <div className="group-stats">
                  <div className="stat-item">
                    <span className="stat-label">Clients:</span>
                    <span className="stat-value">{group.member_count || 0}</span>
                  </div>
                </div>

                <div className="group-meta">
                  <div className="meta-item">
                    <span className="meta-label">Créé le:</span>
                    <span className="meta-value">{formatDate(group.created_at)}</span>
                  </div>
                  {group.updated_at && (
                    <div className="meta-item">
                      <span className="meta-label">Modifié le:</span>
                      <span className="meta-value">{formatDate(group.updated_at)}</span>
                    </div>
                  )}
                </div>

                <div className="group-footer">
                  <button
                    className="view-members-btn"
                    onClick={() => handleViewMembers(group)}
                  >
                    👥 Voir les membres
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddGroupModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onGroupAdded={handleGroupAdded}
        userId={user?.id}
      />

      <GroupMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false)
          setSelectedGroup(null)
        }}
        group={selectedGroup}
      />
    </div>
  )
}

export default GroupsPage