import { useState, useEffect } from 'react'
import ConfirmationModal from '../../components/Modals/ConfirmationModal/ConfirmationModal'
import AddToGroupModal from '../../components/Modals/AddToGroupModal/AddToGroupModal'
import CustomerReviewsPage from '../CustomerReviewsPage/CustomerReviewsPage'
import { customersApi, customerReviewsApi, exportApi, quotasApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/UI/Toast'
import './ClientsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const ClientsPage = ({ onOpenCustomer }) => {
  const { user } = useAuth()
  const { showQuotaError } = useToast()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [emailVerificationFilter, setEmailVerificationFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalClients, setTotalClients] = useState(0)
  const [totalFilteredClients, setTotalFilteredClients] = useState(0)
  const [pageSize] = useState(20)
  const [error, setError] = useState(null)
  const [selectedClients, setSelectedClients] = useState(new Set())
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false)
  const [showReviewsView, setShowReviewsView] = useState(false)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
  const [bulkColumn, setBulkColumn] = useState('')
  const [bulkSearchValue, setBulkSearchValue] = useState('')
  const [bulkNewValue, setBulkNewValue] = useState('')
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false)

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients()
    }
    fetchPendingReviewsCount()
  }, [])

  const fetchClients = async (page = currentPage) => {
    setIsLoadingClients(true)
    try {
      // Construire l'URL avec la pagination et les filtres
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      })

      // Ajouter la recherche si elle existe
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await fetch(`${API_URL}/api/v1/customers?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      setClients(data.customers || [])
      setTotalClients(data.total || 0)
      setCurrentPage(data.page || page)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setError('Erreur lors du chargement des clients')
      setClients([])
      setTotalClients(0)
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchPendingReviewsCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/?page=1&size=1`)
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      const data = await response.json()
      setPendingReviewsCount(data.total || 0)
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de clients en attente:', error)
      setPendingReviewsCount(0)
    }
  }

  // Filtrage des clients (côté client pour les filtres non gérés par l'API)
  useEffect(() => {
    let filtered = clients.filter(client => {
      const matchesCountry = selectedCountry === '' || client.country === selectedCountry
      const matchesYear = selectedYear === '' || (client.reference && client.reference.startsWith(selectedYear))

      const matchesEmailVerification = emailVerificationFilter === '' ||
        (emailVerificationFilter === 'verified' && client.verified_email === true) ||
        (emailVerificationFilter === 'unverified' && client.verified_email === false)

      const matchesMonth = selectedMonth === '' || getClientMonth(client) === selectedMonth

      return matchesCountry && matchesYear && matchesEmailVerification && matchesMonth
    })

    // Filtre de modification en masse
    if (bulkColumn && bulkSearchValue) {
      filtered = filtered.filter(client => {
        const value = client[bulkColumn]
        return value && String(value).toLowerCase() === bulkSearchValue.toLowerCase()
      })
    }

    setFilteredClients(filtered)

    // Calculer le nombre total de clients filtrés (estimation basée sur la proportion de la page actuelle)
    if (clients.length > 0) {
      const filterRatio = filtered.length / clients.length
      setTotalFilteredClients(Math.round(totalClients * filterRatio))
    } else {
      setTotalFilteredClients(0)
    }
  }, [clients, selectedCountry, selectedYear, selectedMonth, emailVerificationFilter, totalClients, bulkColumn, bulkSearchValue])

  // Effet pour recharger les clients lors du changement de recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Revenir à la page 1 lors d'une recherche
      fetchClients(1)
    }, 500) // Délai de 500ms pour éviter trop de requêtes

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Obtenir les pays uniques (en majuscules)
  const getUniqueCountries = () => {
    const countries = clients.map(client => client.country ? client.country.toUpperCase() : '').filter(Boolean)
    return [...new Set(countries)].sort()
  }

  // Obtenir les années uniques à partir des références
  const getUniqueYears = () => {
    const years = clients.map(client => {
      if (!client.reference) return ''
      const year = client.reference.match(/^\d{4}/)
      return year ? year[0] : ''
    }).filter(Boolean)
    return [...new Set(years)].sort().reverse() // Années les plus récentes en premier
  }

  // Fonction pour extraire le mois d'un client (depuis date ou created_at)
  const getClientMonth = (client) => {
    // Essayer d'abord avec la clé "date" (format "xx/xx/xxxx" -> jour/mois/année)
    if (client.date) {
      const dateParts = client.date.split('/')
      if (dateParts.length === 3) {
        const month = dateParts[1] // Le mois est le deuxième élément
        // Vérifier que le mois est valide (entre 01 et 12)
        if (month && !isNaN(parseInt(month)) && parseInt(month) >= 1 && parseInt(month) <= 12) {
          return month.padStart(2, '0') // Retourne "01" à "12"
        }
      }
    }

    // Si date est vide ou invalide, utiliser created_at (format ISO)
    if (client.created_at) {
      const dateObj = new Date(client.created_at)
      if (!isNaN(dateObj.getTime())) {
        return String(dateObj.getMonth() + 1).padStart(2, '0') // Retourne "01" à "12"
      }
    }

    return ''
  }

  // Obtenir tous les mois de l'année
  const getAllMonths = () => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return monthNames.map((name, index) => ({
      value: String(index + 1).padStart(2, '0'),
      label: name
    }))
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCountry('')
    setSelectedYear('')
    setSelectedMonth('')
    setEmailVerificationFilter('')
    setBulkColumn('')
    setBulkSearchValue('')
    setBulkNewValue('')
    setCurrentPage(1)
    // Recharger la première page sans filtres
    setTimeout(() => fetchClients(1), 100)
  }

  // Colonnes disponibles pour la modification en masse
  const bulkEditColumns = [
    { value: 'postal_code', label: 'Code postal' },
    { value: 'city', label: 'Ville' },
    { value: 'country', label: 'Pays' },
    { value: 'group', label: 'Groupe' },
  ]

  const handleBulkUpdate = () => {
    if (!bulkColumn || !bulkSearchValue || !bulkNewValue) return
    setShowBulkConfirmModal(true)
  }

  const confirmBulkUpdate = async () => {
    setIsBulkUpdating(true)
    setShowBulkConfirmModal(false)
    try {
      // Récupérer tous les clients sans pagination pour trouver tous ceux qui correspondent
      const params = new URLSearchParams({ size: totalClients.toString() })
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      const response = await fetch(`${API_URL}/api/v1/customers?${params}`)
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
      const data = await response.json()
      const allClients = data.customers || []

      // Filtrer ceux qui correspondent à la valeur recherchée sur la colonne choisie
      const matchingClients = allClients.filter(client => {
        const value = client[bulkColumn]
        return value && String(value).toLowerCase() === bulkSearchValue.toLowerCase()
      })

      if (matchingClients.length === 0) {
        setError('Aucun client correspondant trouvé')
        return
      }

      // Construire le payload : chaque client avec son id + le champ à modifier
      const customers = matchingClients.map(client => ({
        id: client.id,
        [bulkColumn]: bulkNewValue
      }))

      await customersApi.bulkUpdate(customers)

      // Rafraîchir la liste
      await fetchClients(currentPage)
      // Réinitialiser les champs de recherche
      setBulkSearchValue('')
      setBulkNewValue('')
    } catch (error) {
      console.error('Erreur lors de la mise à jour en masse:', error)
      setError('Erreur lors de la mise à jour en masse')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // Fonctions de pagination
  const totalPages = Math.ceil(totalClients / pageSize)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchClients(page)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const handleAddClient = () => {
    console.log('Ajouter un client')
    // À implémenter plus tard
  }

  const handleWarningClick = () => {
    setShowReviewsView(true)
  }

  const handleCloseReviewsView = () => {
    setShowReviewsView(false)
  }

  const handleViewClient = (client) => {
    if (onOpenCustomer) {
      onOpenCustomer(client.id)
    }
  }

  const handleRowClick = (client, e) => {
    // Ne pas ouvrir le modal si on clique sur la checkbox ou le bouton d'action
    if (e.target.type === 'checkbox' || e.target.closest('.action-btn') || e.target.closest('.checkbox-column')) {
      return
    }
    handleViewClient(client)
  }

  // Gestion de la sélection des clients
  const handleClientSelect = (clientId) => {
    setSelectedClients(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId)
      } else {
        newSelected.add(clientId)
      }
      return newSelected
    })
  }

  const handleSelectAll = async () => {
    if (selectedClients.size > 0) {
      // Tout désélectionner
      setSelectedClients(new Set())
    } else {
      // Sélectionner TOUS les clients (toutes pages)
      try {
        // Récupérer tous les clients sans pagination
        const params = new URLSearchParams({
          size: totalClients.toString() // Récupérer tous les clients
        })

        // Ajouter la recherche si elle existe
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim())
        }

        const response = await fetch(`${API_URL}/api/v1/customers?${params}`)

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()
        const allClients = data.customers || []

        // Appliquer les filtres côté client (comme pour filteredClients)
        const allFilteredClients = allClients.filter(client => {
          const matchesCountry = selectedCountry === '' || client.country === selectedCountry
          const matchesYear = selectedYear === '' || (client.reference && client.reference.startsWith(selectedYear))
          const matchesEmailVerification = emailVerificationFilter === '' ||
            (emailVerificationFilter === 'verified' && client.verified_email === true) ||
            (emailVerificationFilter === 'unverified' && client.verified_email === false)
          const matchesMonth = selectedMonth === '' || getClientMonth(client) === selectedMonth

          return matchesCountry && matchesYear && matchesEmailVerification && matchesMonth
        })

        // Sélectionner tous les IDs des clients filtrés
        setSelectedClients(new Set(allFilteredClients.map(client => client.id)))
      } catch (error) {
        console.error('Erreur lors de la sélection de tous les clients:', error)
        // En cas d'erreur, sélectionner au moins les clients de la page actuelle
        setSelectedClients(new Set(filteredClients.map(client => client.id)))
      }
    }
  }

  // Utiliser totalFilteredClients si des filtres sont appliqués, sinon totalClients
  const totalSelectableClients = (selectedCountry || selectedYear || selectedMonth || emailVerificationFilter)
    ? totalFilteredClients
    : totalClients

  const isAllSelected = totalSelectableClients > 0 && selectedClients.size === totalSelectableClients
  const isSomeSelected = selectedClients.size > 0 && selectedClients.size < totalSelectableClients

  // Export CSV
  const handleExportClick = () => {
    if (selectedClients.size === 0) return
    setShowExportModal(true)
  }

  const exportCSV = async () => {
    const selectedClientsData = clients.filter(client => selectedClients.has(client.id))

    if (selectedClientsData.length === 0) return

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
        data: selectedClientsData.map(client => ({
          reference: client.reference || '',
          first_name: client.first_name || '',
          last_name: client.last_name || '',
          email: client.email || '',
          phone: client.phone || '',
          job: client.job || '',
          city: client.city || '',
          country: client.country || ''
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

      // Vérifier si la réponse est un fichier CSV
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/csv')) {
        // Télécharger le fichier CSV retourné par l'API
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `export_clients_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Traiter une réponse JSON si l'API retourne autre chose
        const result = await response.json()
        console.log('Export réussi:', result)
      }

      setShowExportModal(false)
      setSelectedClients(new Set()) // Désélectionner après export
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      setError('Erreur lors de l\'export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const handleAddToGroupClick = () => {
    if (selectedClients.size === 0) return
    setShowAddToGroupModal(true)
  }

  const handleClientsAddedToGroup = (group, clientIds) => {
    console.log(`${clientIds.length} clients ajoutés au groupe "${group.name}"`)

    // Optionnel: désélectionner les clients après ajout
    setSelectedClients(new Set())

    // Afficher un message de succès (vous pouvez ajouter un state pour cela)
    alert(`${clientIds.length} client${clientIds.length > 1 ? 's' : ''} ajouté${clientIds.length > 1 ? 's' : ''} au groupe "${group.name}" avec succès !`)
  }

  // Si on affiche la vue de validation, afficher seulement celle-ci (si l'utilisateur a accès)
  if (showReviewsView && user?.role?.customers_review_access) {
    return <CustomerReviewsPage onClose={handleCloseReviewsView} />
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2>Base de données clients</h2>
          <p>
            Gestion et consultation de la base clients ({filteredClients.length} client
            {filteredClients.length !== 1 ? 's' : ''} sur {totalClients} total)
          </p>
        </div>
        <div className="header-actions">
          {selectedClients.size > 0 && (
            <div className="bulk-actions">
              <button className="bulk-action-btn group-btn" onClick={handleAddToGroupClick}>
                <span className="btn-icon">👥</span>
                <span className="btn-text">Ajouter à un groupe</span>
                <span className="btn-badge">{selectedClients.size}</span>
              </button>
              <button className="bulk-action-btn export-btn" onClick={handleExportClick}>
                <span className="btn-icon">📥</span>
                <span className="btn-text">Télécharger CSV</span>
                <span className="btn-badge">{selectedClients.size}</span>
              </button>
            </div>
          )}
          <div className="primary-actions">
            {user?.role?.customers_review_access && pendingReviewsCount > 0 && (
              <button className="action-btn warning-btn" onClick={handleWarningClick}>
                <span className="btn-icon">!</span>
                <span className="btn-tooltip">Clients en attente ({pendingReviewsCount})</span>
              </button>
            )}
            {user?.role?.customers_edit && (
              <button className="action-btn add-btn" onClick={handleAddClient}>
                <span className="btn-icon">+</span>
                <span className="btn-tooltip">Ajouter un client</span>
              </button>
            )}
            <button className="action-btn refresh-btn" onClick={() => {
              fetchClients()
              fetchPendingReviewsCount()
            }}>
              <span className="btn-icon">↻</span>
              <span className="btn-tooltip">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, référence, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dropdown-filters">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les pays</option>
              {getUniqueCountries().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les années</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les mois</option>
              {getAllMonths().map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={emailVerificationFilter}
              onChange={(e) => setEmailVerificationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les emails</option>
              <option value="verified">Emails vérifiés</option>
              <option value="unverified">Emails non vérifiés</option>
            </select>

            <button className="reset-filters-btn" onClick={resetFilters}>
              🔄 Réinitialiser
            </button>
          </div>
        </div>

        {/* Modification en masse */}
        {user?.role?.customers_edit && (
          <div className="bulk-edit-row">
            <span className="bulk-edit-label">Modifier en masse</span>
            <select
              value={bulkColumn}
              onChange={(e) => {
                setBulkColumn(e.target.value)
                setBulkSearchValue('')
                setBulkNewValue('')
              }}
              className="filter-select bulk-edit-select"
            >
              <option value="">Colonne...</option>
              {bulkEditColumns.map(col => (
                <option key={col.value} value={col.value}>{col.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Valeur recherchée..."
              value={bulkSearchValue}
              onChange={(e) => setBulkSearchValue(e.target.value)}
              className="search-input bulk-edit-input"
              disabled={!bulkColumn}
            />
            <input
              type="text"
              placeholder="Nouvelle valeur..."
              value={bulkNewValue}
              onChange={(e) => setBulkNewValue(e.target.value)}
              className="search-input bulk-edit-input"
              disabled={!bulkColumn || !bulkSearchValue}
            />
            <button
              className="bulk-edit-apply-btn"
              onClick={handleBulkUpdate}
              disabled={!bulkColumn || !bulkSearchValue || !bulkNewValue || isBulkUpdating}
            >
              {isBulkUpdating ? 'Mise à jour...' : 'Appliquer'}
            </button>
            {bulkColumn && bulkSearchValue && (
              <span className="bulk-edit-count">
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} trouvé{filteredClients.length !== 1 ? 's' : ''}
              </span>
            )}
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

      {isLoadingClients ? (
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des clients...
          </span>
        </div>
      ) : (
        <div className="clients-table-container">
          <table className="clients-table">
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
                <th>Métier</th>
                <th>Ville</th>
                <th>Pays</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className={`client-row ${selectedClients.has(client.id) ? 'selected-row' : ''}`}
                  onClick={(e) => handleRowClick(client, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleClientSelect(client.id)}
                    />
                  </td>
                  <td>{client.first_name}</td>
                  <td>{client.last_name}</td>
                  <td>
                    <div className="email-cell">
                      <span className="email-address">{client.email}</span>
                      {client.verified_email === true && (
                        <span className="verified-badge" title="Email vérifié">
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <span className="email-address">{client.phone}</span>
                      {client.verified_phone === true && (
                        <span className="verified-badge" title="Téléphone vérifié">
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{client.job}</td>
                  <td>{client.city}</td>
                  <td>{client.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && clients.length > 0 && (
            <div className="empty-state">
              <p>Aucun client ne correspond aux critères de recherche</p>
            </div>
          )}
          {clients.length === 0 && !isLoadingClients && (
            <div className="empty-state">
              <p>Aucun client trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {currentPage} sur {totalPages} · {totalClients} clients au total
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Page précédente"
            >
              ‹
            </button>

            {/* Pages autour de la page actuelle */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, currentPage - 2)
              const pageNumber = startPage + i
              if (pageNumber <= totalPages) {
                return (
                  <button
                    key={pageNumber}
                    className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                )
              }
              return null
            })}

            <button
              className="pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Page suivante"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={exportCSV}
        title="Confirmer l'export CSV"
        message={`Êtes-vous sûr de vouloir exporter ${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} au format CSV ?`}
        confirmText="Confirmer l'export"
        isLoading={isExporting}
      />

      <AddToGroupModal
        isOpen={showAddToGroupModal}
        onClose={() => setShowAddToGroupModal(false)}
        onClientsAdded={handleClientsAddedToGroup}
        selectedClients={selectedClients}
      />

      <ConfirmationModal
        isOpen={showBulkConfirmModal}
        onClose={() => setShowBulkConfirmModal(false)}
        onConfirm={confirmBulkUpdate}
        title="Confirmer la modification en masse"
        message={`Voulez-vous modifier la colonne "${bulkEditColumns.find(c => c.value === bulkColumn)?.label || bulkColumn}" de "${bulkSearchValue}" vers "${bulkNewValue}" pour tous les clients correspondants dans la base de données ?`}
        confirmText="Appliquer la modification"
        isLoading={isBulkUpdating}
      />
    </div>
  )
}

export default ClientsPage