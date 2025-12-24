import { useState, useEffect } from 'react'
import EditCustomerModal from '../components/Modals/EditCustomerModal'
import './ClientsPage.css'

const ClientsPage = () => {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [error, setError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedClients, setSelectedClients] = useState(new Set())

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients()
    }
  }, [])

  const fetchClients = async () => {
    setIsLoadingClients(true)
    try {
      const response = await fetch('http://0.0.0.0:8000/api/v1/customers/')

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      setClients(data.customers || [])
      setFilteredClients(data.customers || [])
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setError('Erreur lors du chargement des clients')
      setClients([])
      setFilteredClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }

  // Filtrage des clients
  useEffect(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = searchTerm === '' ||
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCity = selectedCity === '' || cleanCityName(client.city) === selectedCity
      const matchesCountry = selectedCountry === '' || client.country === selectedCountry

      return matchesSearch && matchesCity && matchesCountry
    })

    setFilteredClients(filtered)
  }, [clients, searchTerm, selectedCity, selectedCountry])

  // Nettoyer le nom de ville
  const cleanCityName = (city) => {
    if (!city) return ''
    return city
      .toLowerCase()
      .replace(/[^a-zA-ZÀ-ÿ\s-]/g, '') // Supprimer tout sauf lettres, espaces et tirets
      .trim()
  }

  // Obtenir les villes uniques
  const getUniqueCities = () => {
    const cities = clients.map(client => cleanCityName(client.city)).filter(Boolean)
    return [...new Set(cities)].sort()
  }

  // Obtenir les pays uniques
  const getUniqueCountries = () => {
    const countries = clients.map(client => client.country).filter(Boolean)
    return [...new Set(countries)].sort()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCity('')
    setSelectedCountry('')
  }

  const handleAddClient = () => {
    console.log('Ajouter un client')
    // À implémenter plus tard
  }

  const handleViewClient = (client) => {
    setSelectedCustomer(client)
    setShowEditModal(true)
  }

  const handleCustomerUpdated = (updatedCustomer) => {
    // Mettre à jour la liste des clients
    setClients(prev => prev.map(client =>
      client.id === updatedCustomer.id ? updatedCustomer : client
    ))
    fetchClients() // Recharger pour être sûr d'avoir les dernières données
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

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      // Tout désélectionner
      setSelectedClients(new Set())
    } else {
      // Tout sélectionner
      setSelectedClients(new Set(filteredClients.map(client => client.id)))
    }
  }

  const isAllSelected = filteredClients.length > 0 && selectedClients.size === filteredClients.length
  const isSomeSelected = selectedClients.size > 0 && selectedClients.size < filteredClients.length

  // Export CSV
  const downloadCSV = () => {
    const selectedClientsData = clients.filter(client => selectedClients.has(client.id))

    if (selectedClientsData.length === 0) return

    const headers = ['Référence', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Métier', 'Ville', 'Pays']
    const csvContent = [
      headers.join(','),
      ...selectedClientsData.map(client => [
        `"${client.reference || ''}"`,
        `"${client.last_name || ''}"`,
        `"${client.first_name || ''}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.job || ''}"`,
        `"${client.city || ''}"`,
        `"${client.country || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2>Base de données clients</h2>
          <p>
            Gestion et consultation de la base clients ({filteredClients.length} client
            {filteredClients.length !== 1 ? 's' : ''} sur {clients.length})
          </p>
        </div>
        <div className="header-actions">
          {selectedClients.size > 0 && (
            <button className="download-csv-btn" onClick={downloadCSV}>
              📥 Télécharger en CSV ({selectedClients.size})
            </button>
          )}
          <button className="add-client-btn" onClick={handleAddClient}>
            ➕
          </button>
          <button className="refresh-btn" onClick={fetchClients}>
            🔄 Actualiser
          </button>
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
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les villes</option>
              {getUniqueCities().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

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
                <th>Référence</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Métier</th>
                <th>Ville</th>
                <th>Pays</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className={selectedClients.has(client.id) ? 'selected-row' : ''}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleClientSelect(client.id)}
                    />
                  </td>
                  <td>{client.reference}</td>
                  <td>{client.first_name}</td>
                  <td>{client.last_name}</td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td>{client.job}</td>
                  <td>{client.city}</td>
                  <td>{client.country}</td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => handleViewClient(client)}
                    >
                      Voir
                    </button>
                  </td>
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

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCustomerUpdated={handleCustomerUpdated}
        customer={selectedCustomer}
      />
    </div>
  )
}

export default ClientsPage