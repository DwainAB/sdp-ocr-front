import { useState, useEffect } from 'react'
import ConfirmationModal from './ConfirmationModal'
import './AddToGroupModal.css'

const API_URL = import.meta.env.VITE_API_URL

const AddToGroupModal = ({ isOpen, onClose, onClientsAdded, selectedClients }) => {
  const [groups, setGroups] = useState([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isAddingToGroup, setIsAddingToGroup] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchGroups()
    }
  }, [isOpen])

  const fetchGroups = async () => {
    setIsLoadingGroups(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/v1/groups/`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      setGroups(data.groups || data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
      setError('Erreur lors du chargement des groupes')
      setGroups([])
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId)
    setError('')
  }

  const handleSubmit = () => {
    if (!selectedGroup) {
      setError('Veuillez sélectionner un groupe')
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmAddToGroup = async () => {
    if (!selectedGroup || selectedClients.size === 0) return

    setIsAddingToGroup(true)
    try {
      const selectedGroupData = groups.find(g => g.id.toString() === selectedGroup)
      const clientIds = Array.from(selectedClients)

      // Récupérer l'ID de l'utilisateur depuis le localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const addedBy = user.id

      if (!addedBy) {
        throw new Error('Utilisateur non identifié')
      }

      console.log('Ajout des clients:', clientIds, 'au groupe:', selectedGroupData)

      const response = await fetch(`${API_URL}/api/v1/groups/${selectedGroup}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_ids: clientIds,
          added_by: addedBy
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'ajout au groupe')
      }

      const result = await response.json()
      console.log('Clients ajoutés avec succès:', result)

      // Notifier le composant parent
      onClientsAdded(selectedGroupData, clientIds)

      // Fermer les modals
      setShowConfirmModal(false)
      handleClose()
    } catch (error) {
      console.error('Erreur lors de l\'ajout au groupe:', error)
      setError(error.message)
    } finally {
      setIsAddingToGroup(false)
    }
  }

  const handleClose = () => {
    if (!isAddingToGroup) {
      setSelectedGroup('')
      setError('')
      setShowConfirmModal(false)
      onClose()
    }
  }

  const getSelectedGroupName = () => {
    const group = groups.find(g => g.id.toString() === selectedGroup)
    return group?.name || ''
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="add-to-group-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Ajouter à un groupe</h2>
            <button
              className="modal-close-btn"
              onClick={handleClose}
              disabled={isAddingToGroup}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="selection-summary">
              <p>
                <strong>{selectedClients.size}</strong> client{selectedClients.size > 1 ? 's' : ''} sélectionné{selectedClients.size > 1 ? 's' : ''}
              </p>
            </div>

            {error && (
              <div className="form-error">
                <span>⚠️ {error}</span>
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
              <div className="groups-selection">
                <h3>Sélectionnez un groupe :</h3>

                {groups.length === 0 ? (
                  <div className="empty-state">
                    <p>Aucun groupe disponible</p>
                    <small>Créez d'abord un groupe dans la section Groupes</small>
                  </div>
                ) : (
                  <div className="groups-grid">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`group-option ${selectedGroup === group.id.toString() ? 'selected' : ''}`}
                        onClick={() => handleGroupSelect(group.id.toString())}
                      >
                        <div className="group-option-header">
                          <h4>{group.name}</h4>
                          <div className="group-members-count">
                            {group.member_count || 0} membre{(group.member_count || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <p className="group-description">
                          {group.description || 'Aucune description'}
                        </p>
                        <div className="selection-indicator">
                          {selectedGroup === group.id.toString() && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isAddingToGroup}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!selectedGroup || groups.length === 0 || isAddingToGroup}
            >
              Ajouter au groupe
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAddToGroup}
        title="Confirmer l'ajout au groupe"
        message={`Êtes-vous sûr de vouloir ajouter ${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} au groupe "${getSelectedGroupName()}" ?`}
        confirmText="Confirmer l'ajout"
        isLoading={isAddingToGroup}
      />
    </>
  )
}

export default AddToGroupModal