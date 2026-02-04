import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../../services/api'
import './OrdersPage.css'

const OrdersPage = ({ onOpenOrder }) => {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pageSize] = useState(20)
  const [error, setError] = useState(null)

  const statusOptions = [
    { value: 'PENDING', label: 'En attente', color: '#eab308' },
    { value: 'IN_PROGRESS', label: 'En cours', color: '#8b5cf6' },
    { value: 'COMPLETED', label: 'Terminée', color: '#10b981' },
    { value: 'CANCELLED', label: 'Annulée', color: '#ef4444' },
  ]

  const fetchOrders = useCallback(async (page = currentPage) => {
    setIsLoading(true)
    setError(null)
    try {
      const filters = {
        status: selectedStatus || undefined,
        orderType: selectedType || undefined,
        search: searchTerm.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }
      const data = await ordersApi.getAll(page, pageSize, filters)
      setOrders(data.orders || [])
      setTotalOrders(data.total || 0)
      setCurrentPage(data.page || page)
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
      setError('Erreur lors du chargement des commandes')
      setOrders([])
      setTotalOrders(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, selectedStatus, selectedType, searchTerm, dateFrom, dateTo])

  useEffect(() => {
    fetchOrders(1)
    setCurrentPage(1)
  }, [selectedStatus, selectedType, dateFrom, dateTo])

  // Debounce pour la recherche par nom
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchOrders(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: '#6b7280' }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedType('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalOrders / pageSize)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchOrders(page)
    }
  }

  const handleRowClick = (order) => {
    if (onOpenOrder) {
      onOpenOrder(order.id)
    }
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div>
          <h2>Liste des commandes</h2>
          <p>
            {totalOrders} commande{totalOrders !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="header-actions">
          <div className="primary-actions">
            <button className="action-btn refresh-btn" onClick={() => fetchOrders()}>
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
              placeholder="Rechercher par nom, prénom, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dropdown-filters">
            <div className="date-filter-group">
              <label className="date-label">Statut</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les statuts</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="date-filter-group">
              <label className="date-label">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les types</option>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="sur-mesure">Sur mesure</option>
              </select>
            </div>

            <div className="date-filter-group">
              <label className="date-label">Date de début</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="filter-select date-input"
              />
            </div>

            <div className="date-filter-group">
              <label className="date-label">Date de fin</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="filter-select date-input"
              />
            </div>

            <div className="date-filter-group">
              <label className="date-label">&nbsp;</label>
              <button className="reset-filters-btn" onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="file-status">
          <div className="status-indicator error">
            {error}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des commandes...
          </span>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Type</th>
                <th>Date de création</th>
                <th>Date souhaitée</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <tr
                    key={order.id}
                    className="order-row"
                    onClick={() => handleRowClick(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{order.reference || '-'}</td>
                    <td>{order.customer?.last_name || '-'}</td>
                    <td>{order.customer?.first_name || '-'}</td>
                    <td>{order.type || '-'}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{formatDate(order.desired_date)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {orders.length === 0 && !isLoading && (
            <div className="empty-state">
              <p>Aucune commande trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {currentPage} sur {totalPages} · {totalOrders} commandes au total
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              title="Page précédente"
            >
              ‹
            </button>

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
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Page suivante"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
