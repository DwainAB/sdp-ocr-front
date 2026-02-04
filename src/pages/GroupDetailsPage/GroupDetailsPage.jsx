import { useState, useEffect } from 'react'
import ConfirmationModal from '../../components/Modals/ConfirmationModal/ConfirmationModal'
import { quotasApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/UI/Toast'
import './GroupDetailsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const GroupDetailsPage = ({ groupIds, onBack }) => {
  const { user } = useAuth()
  const { showQuotaError } = useToast()
  const [groups, setGroups] = useState([])
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
    if (groupIds && groupIds.length > 0) {
      fetchGroupsDetails()
      fetchGroupMembers()
    }
  }, [groupIds])

  const fetchGroupsDetails = async () => {
    try {
      // Récupérer les détails de tous les groupes sélectionnés
      const groupsData = await Promise.all(
        groupIds.map(async (id) => {
          const response = await fetch(`${API_URL}/api/v1/groups/${id}`)
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }
          return response.json()
        })
      )
      setGroups(groupsData)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
      setError('Erreur lors du chargement des groupes')
    }
  }

  const fetchGroupMembers = async () => {
    if (!groupIds || groupIds.length === 0) return

    setIsLoadingMembers(true)
    setError(null)

    try {
      // Utiliser la nouvelle API avec group_ids
      const groupIdsParam = groupIds.join(',')
      const response = await fetch(`${API_URL}/api/v1/groups/customers?group_ids=${groupIdsParam}`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      const groupMembers = data.customers || []

      console.log(`Trouvé ${groupMembers.length} membres pour les groupes ${groupIdsParam}`)

      setMembers(groupMembers)
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error)
      setError('Erreur lors du chargement des membres des groupes')
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

  const removeMembersFromGroup = async () => {
    if (!groupIds || groupIds.length === 0 || selectedMembers.size === 0) return

    setIsRemoving(true)
    try {
      const customerIds = Array.from(selectedMembers)

      // Retirer les membres de tous les groupes sélectionnés
      await Promise.all(
        groupIds.map(async (groupId) => {
          const response = await fetch(`${API_URL}/api/v1/groups/${groupId}/customers`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customer_ids: customerIds })
          })

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }
        })
      )

      // Retirer les membres de la liste locale
      setMembers(prev => prev.filter(member => !selectedMembers.has(member.id)))
      setSelectedMembers(new Set())
      setShowRemoveModal(false)
    } catch (error) {
      console.error('Erreur lors du retrait des membres:', error)
      setError('Erreur lors du retrait des membres des groupes')
    } finally {
      setIsRemoving(false)
    }
  }

  const exportMembersCSV = async () => {
    const selectedMembersData = members.filter(member => selectedMembers.has(member.id))

    if (selectedMembersData.length === 0) return

    setIsExporting(true)
    try {
      // Vérifier et consommer le quota CSV avant l'export
      if (user?.id) {
        try {
          await quotasApi.consumeCsvQuota(user.id)
        } catch (quotaError) {
          if (quotaError.status === 429) {
            showQuotaError(quotaError.detail || { type: 'csv' })
            setShowExportModal(false)
            setIsExporting(false)
            return
          }
          throw quotaError
        }
      }

      const exportData = {
        data: selectedMembersData.map(member => ({
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          email: member.email || '',
          phone: member.phone || '',
          job: member.job || '',
          city: member.city || '',
          country: member.country || ''
        }))
      }

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
        const groupNames = groups.map(g => g.name).join('_')
        link.setAttribute('download', `membres_${groupNames.replace(/[^a-zA-Z0-9_]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
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

  const isAllSelected = filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length
  const isSomeSelected = selectedMembers.size > 0 && selectedMembers.size < filteredMembers.length

  if (groups.length === 0) {
    return (
      <div className="section-content">
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des groupes...
          </span>
        </div>
      </div>
    )
  }

  const groupTitle = groups.length === 1
    ? groups[0].name
    : `${groups.length} groupes sélectionnés`

  const groupDescription = groups.length === 1
    ? (groups[0].description || 'Aucune description')
    : groups.map(g => g.name).join(', ')

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <button className="back-button" onClick={onBack}>
            ← Retour aux groupes
          </button>
          <h2>{groupTitle}</h2>
          <p>{groupDescription}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn refresh-btn" onClick={fetchGroupMembers}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      <div className="group-info-section">
        <div className="info-item">
          <span className="info-label">Nombre de groupes:</span>
          <span className="info-value">{groups.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Nombre de membres:</span>
          <span className="info-value">{members.length}</span>
        </div>
        {groups.length === 1 && (
          <>
            <div className="info-item">
              <span className="info-label">Créé le:</span>
              <span className="info-value">{formatDate(groups[0].created_at)}</span>
            </div>
            {groups[0].updated_at && (
              <div className="info-item">
                <span className="info-label">Modifié le:</span>
                <span className="info-value">{formatDate(groups[0].updated_at)}</span>
              </div>
            )}
          </>
        )}
      </div>

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

      <div className="members-footer">
        <div className="members-count">
          {filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''}
          {filteredMembers.length !== members.length && ` sur ${members.length}`}
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
        title={`Retirer les membres ${groups.length > 1 ? 'des groupes' : 'du groupe'}`}
        message={`Êtes-vous sûr de vouloir retirer ${selectedMembers.size} membre${selectedMembers.size > 1 ? 's' : ''} ${groups.length > 1 ? `des ${groups.length} groupes sélectionnés` : `du groupe "${groups[0]?.name}"`} ? Cette action est irréversible.`}
        confirmText="Retirer"
        cancelText="Annuler"
        isLoading={isRemoving}
      />
    </div>
  )
}

export default GroupDetailsPage
