import { useState, useEffect } from 'react'
import ConfirmationModal from './ConfirmationModal'
import './GroupMembersModal.css'

const API_URL = import.meta.env.VITE_API_URL

const GroupMembersModal = ({ isOpen, onClose, group }) => {
  const [members, setMembers] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMembers, setFilteredMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState(new Set())
  const [showExportModal, setShowExportModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Filtrage des membres
  useEffect(() => {
    let filtered = members.filter(member => {
      const matchesSearch = searchTerm === '' ||
        member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })

    setFilteredMembers(filtered)
  }, [members, searchTerm])

  useEffect(() => {
    if (isOpen && group) {
      fetchGroupMembers()
    }
  }, [isOpen, group])

  const fetchGroupMembers = async () => {
    if (!group?.id) return

    setIsLoadingMembers(true)
    setError(null)

    try {
      // Tentative avec l'endpoint spécifique du groupe (à ajuster selon votre API)
      let response
      let groupMembers = []

      // Récupérer tous les clients d'abord
      response = await fetch(`${API_URL}/api/v1/customers/`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      const allClients = data.customers || []
      groupMembers = []

      // Pour chaque client, vérifier s'il appartient au groupe
      for (const client of allClients) {
        try {
          const groupResponse = await fetch(`${API_URL}/api/v1/groups/customer/${client.id}`)

          if (groupResponse.ok) {
            const clientGroups = await groupResponse.json()
            // Vérifier si le client appartient au groupe sélectionné
            const belongsToGroup = clientGroups.groups && clientGroups.groups.some(g => g.id === group.id)

            if (belongsToGroup) {
              groupMembers.push(client)
            }
          }
        } catch (clientError) {
          console.warn(`Erreur lors de la vérification du client ${client.id}:`, clientError)
        }
      }

      console.log(`Trouvé ${groupMembers.length} membres pour le groupe ${group.name}`)

      setMembers(groupMembers)
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error)
      setError('Erreur lors du chargement des membres du groupe')
      setMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(memberId)) {
        newSelected.delete(memberId)
      } else {
        newSelected.add(memberId)
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(member => member.id)))
    }
  }

  const handleExportClick = () => {
    if (selectedMembers.size === 0) return
    setShowExportModal(true)
  }

  const handleRemoveClick = () => {
    if (selectedMembers.size === 0) return
    setShowRemoveModal(true)
  }

  const handleSendEmail = () => {
    if (selectedMembers.size === 0) return
    // Pour l'instant, ne fait rien (à implémenter plus tard)
    console.log('Envoi d\'email à', selectedMembers.size, 'membres')
  }

  const removeMembersFromGroup = async () => {
    if (!group?.id || selectedMembers.size === 0) return

    setIsRemoving(true)
    try {
      // Utiliser la route DELETE /{group_id}/customers avec les IDs des clients à retirer
      const customerIds = Array.from(selectedMembers)

      const response = await fetch(`${API_URL}/api/v1/groups/${group.id}/customers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customer_ids: customerIds })
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      // Retirer les membres de la liste locale
      setMembers(prev => prev.filter(member => !selectedMembers.has(member.id)))
      setSelectedMembers(new Set())
      setShowRemoveModal(false)
    } catch (error) {
      console.error('Erreur lors du retrait des membres:', error)
      setError('Erreur lors du retrait des membres du groupe')
    } finally {
      setIsRemoving(false)
    }
  }

  const exportMembersCSV = async () => {
    const selectedMembersData = members.filter(member => selectedMembers.has(member.id))

    if (selectedMembersData.length === 0) return

    const exportData = {
      data: selectedMembersData.map(member => ({
        reference: member.reference || '',
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        job: member.job || '',
        city: member.city || '',
        country: member.country || ''
      }))
    }

    setIsExporting(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/export/generate-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/csv')) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `membres_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        const result = await response.json()
        console.log('Export réussi:', result)
      }

      setShowExportModal(false)
      setSelectedMembers(new Set())
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      setError('Erreur lors de l\'export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedMembers(new Set())
    setError(null)
    onClose()
  }

  const isAllSelected = filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length
  const isSomeSelected = selectedMembers.size > 0 && selectedMembers.size < filteredMembers.length

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="members-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <h2>Membres du groupe</h2>
              <span className="group-name">{group?.name}</span>
            </div>
            <button
              className="modal-close-btn"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Actions et recherche */}
            <div className="members-actions">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {selectedMembers.size > 0 && (
                <div className="selection-actions">
                  <button
                    className="send-email-btn"
                    onClick={handleSendEmail}
                  >
                    📧 Envoyer email ({selectedMembers.size})
                  </button>
                  <button
                    className="remove-members-btn"
                    onClick={handleRemoveClick}
                  >
                    Retirer ({selectedMembers.size})
                  </button>
                  <button
                    className="export-csv-btn"
                    onClick={handleExportClick}
                  >
                    📥 Télécharger CSV ({selectedMembers.size})
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {isLoadingMembers ? (
              <div className="loading-section">
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Chargement des membres...
                </span>
              </div>
            ) : (
              <div className="members-table-container">
                {filteredMembers.length === 0 && members.length > 0 && searchTerm && (
                  <div className="empty-state">
                    <p>Aucun membre ne correspond à votre recherche</p>
                  </div>
                )}

                {members.length === 0 && !isLoadingMembers && (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Aucun membre dans ce groupe</h3>
                    <p>Ce groupe ne contient encore aucun membre</p>
                  </div>
                )}

                {filteredMembers.length > 0 && (
                  <table className="members-table">
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
                        <th>Référence</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Ville</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className={selectedMembers.has(member.id) ? 'selected-row' : ''}>
                          <td className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedMembers.has(member.id)}
                              onChange={() => handleMemberSelect(member.id)}
                            />
                          </td>
                          <td>{member.reference}</td>
                          <td>{member.last_name}</td>
                          <td>{member.first_name}</td>
                          <td>{member.email}</td>
                          <td>{member.phone}</td>
                          <td>{member.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="members-count">
              {filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''}
              {filteredMembers.length !== members.length && ` sur ${members.length}`}
            </div>
            <button
              className="btn-secondary"
              onClick={handleClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={exportMembersCSV}
        title="Confirmer l'export CSV"
        message={`Êtes-vous sûr de vouloir exporter ${selectedMembers.size} membre${selectedMembers.size > 1 ? 's' : ''} au format CSV ?`}
        confirmText="Confirmer l'export"
        isLoading={isExporting}
      />

      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={removeMembersFromGroup}
        title="Retirer les membres du groupe"
        message={`Êtes-vous sûr de vouloir retirer ${selectedMembers.size} membre${selectedMembers.size > 1 ? 's' : ''} du groupe "${group?.name}" ? Cette action est irréversible.`}
        confirmText="Retirer"
        cancelText="Annuler"
        isLoading={isRemoving}
      />
    </>
  )
}

export default GroupMembersModal