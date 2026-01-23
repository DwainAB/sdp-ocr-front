import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AddGroupModal from '../../components/Modals/AddGroupModal/AddGroupModal'
import ConfirmationModal from '../../components/Modals/ConfirmationModal/ConfirmationModal'
import './GroupsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const GroupsPage = ({ onOpenGroups }) => {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState(new Set())
  const [groupToDelete, setGroupToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGroups, setFilteredGroups] = useState([])
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

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

  const handleOpenGroup = (group) => {
    if (onOpenGroups) {
      onOpenGroups([group.id])
    }
  }

  const handleGroupSelect = (groupId) => {
    setSelectedGroups(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(groupId)) {
        newSelected.delete(groupId)
      } else {
        newSelected.add(groupId)
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set())
    } else {
      setSelectedGroups(new Set(filteredGroups.map(group => group.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedGroups.size === 0) return
    // Pour simplifier, on supprime le premier groupe sélectionné
    const firstGroupId = Array.from(selectedGroups)[0]
    const group = groups.find(g => g.id === firstGroupId)
    setGroupToDelete(group)
    setShowDeleteModal(true)
  }

  const handleOpenSelected = () => {
    if (selectedGroups.size === 0) return
    const groupIds = Array.from(selectedGroups)
    if (onOpenGroups) {
      onOpenGroups(groupIds)
    }
  }

  const handleRowClick = (group, e) => {
    // Ne pas ouvrir si on clique sur la checkbox
    if (e.target.type === 'checkbox' || e.target.closest('.checkbox-column')) {
      return
    }
    handleOpenGroup(group)
  }

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return

    setIsDeletingGroup(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/groups/${groupToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      // Retirer le groupe de la liste locale
      setGroups(prev => prev.filter(group => group.id !== groupToDelete.id))
      setSelectedGroups(prev => {
        const newSelected = new Set(prev)
        newSelected.delete(groupToDelete.id)
        return newSelected
      })
      setShowDeleteModal(false)
      setGroupToDelete(null)
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error)
      setError('Erreur lors de la suppression du groupe')
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const isAllSelected = filteredGroups.length > 0 && selectedGroups.size === filteredGroups.length
  const isSomeSelected = selectedGroups.size > 0 && selectedGroups.size < filteredGroups.length

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
          <button className="action-btn add-btn" onClick={handleAddGroup}>
            <span className="btn-icon">+</span>
            <span className="btn-tooltip">Ajouter un groupe</span>
          </button>
          <button className="action-btn refresh-btn" onClick={fetchGroups}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et actions */}
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
        {selectedGroups.size > 0 && (
          <div className="selection-actions">
            <button
              className="open-group-btn"
              onClick={handleOpenSelected}
            >
              Ouvrir {selectedGroups.size > 1 ? `(${selectedGroups.size})` : ''}
            </button>
            <button
              className="delete-selected-btn"
              onClick={handleDeleteSelected}
            >
              Supprimer ({selectedGroups.size})
            </button>
          </div>
        )}
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

          {filteredGroups.length > 0 && (
            <div className="groups-table-container">
              <table className="groups-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={input => {
                          if (input) input.indeterminate = isSomeSelected
                        }}
                        onChange={handleSelectAll}
                        title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      />
                    </th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Clients</th>
                    <th>Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr
                      key={group.id}
                      className={selectedGroups.has(group.id) ? 'selected-row' : ''}
                      onClick={(e) => handleRowClick(group, e)}
                    >
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={() => handleGroupSelect(group.id)}
                        />
                      </td>
                      <td className="group-name-cell">{group.name}</td>
                      <td className="description-cell">{group.description || 'Aucune description'}</td>
                      <td className="clients-cell">{group.member_count || 0}</td>
                      <td className="date-cell">{formatDate(group.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AddGroupModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onGroupAdded={handleGroupAdded}
        userId={user?.id}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setGroupToDelete(null)
        }}
        onConfirm={confirmDeleteGroup}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer le groupe "${groupToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeletingGroup}
      />
    </div>
  )
}

export default GroupsPage