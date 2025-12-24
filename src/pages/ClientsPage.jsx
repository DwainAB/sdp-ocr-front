import { useState, useEffect } from 'react'
import './ClientsPage.css'

const ClientsPage = () => {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [error, setError] = useState(null)

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

      const matchesCity = selectedCity === '' || client.city === selectedCity
      const matchesCountry = selectedCountry === '' || client.country === selectedCountry

      return matchesSearch && matchesCity && matchesCountry
    })

    setFilteredClients(filtered)
  }, [clients, searchTerm, selectedCity, selectedCountry])

  // Obtenir les villes uniques
  const getUniqueCities = () => {
    const cities = clients.map(client => client.city).filter(Boolean)
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

  const handleEditList = () => {
    console.log('Modifier la liste')
    // À implémenter plus tard
  }

  const handleViewClient = (client) => {
    console.log('Voir client:', client)
    // À implémenter plus tard
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
          <button className="add-client-btn" onClick={handleAddClient}>
            ➕ Ajouter un client
          </button>
          <button className="edit-list-btn" onClick={handleEditList}>
            ✏️ Modifier la liste
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
                <tr key={client.id}>
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
    </div>
  )
}

export default ClientsPage