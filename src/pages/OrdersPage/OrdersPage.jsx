import { useState, useEffect } from 'react'
import { ordersApi } from '../../services/api'
import './OrdersPage.css'

const OrdersPage = ({ onOpenOrder }) => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pageSize] = useState(20)
  const [error, setError] = useState(null)

  const statusOptions = [
    { value: 'PENDING', label: 'En attente', color: '#eab308' },
    { value: 'CONFIRMED', label: 'Confirmée', color: '#3b82f6' },
    { value: 'IN_PROGRESS', label: 'En cours', color: '#8b5cf6' },
    { value: 'COMPLETED', label: 'Terminée', color: '#10b981' },
    { value: 'CANCELLED', label: 'Annulée', color: '#ef4444' },
  ]

  useEffect(() => {
    fetchOrders()
  }, [currentPage, selectedStatus])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchOrders(1)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchOrders = async (page = currentPage) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await ordersApi.getAll(page, pageSize, searchTerm || null, selectedStatus || null)
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
  }

  // Filtrage côté client pour la date
  useEffect(() => {
    let filtered = orders

    if (selectedDate) {
      filtered = filtered.filter(order => {
        if (!order.created_at) return false
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === selectedDate
      })
    }

    setFilteredOrders(filtered)
  }, [orders, selectedDate])

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
    setSelectedDate('')
    setCurrentPage(1)
    setTimeout(() => fetchOrders(1), 100)
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
            {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} sur {totalOrders} total
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
              placeholder="Rechercher par nom, prénom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dropdown-filters">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-select date-input"
            />

            <button className="reset-filters-btn" onClick={resetFilters}>
              Réinitialiser
            </button>
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
                <th>Nom</th>
                <th>Prénom</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <tr
                    key={order.id}
                    className="order-row"
                    onClick={() => handleRowClick(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{order.customer?.last_name || '-'}</td>
                    <td>{order.customer?.first_name || '-'}</td>
                    <td>{formatDate(order.date)}</td>
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
          {filteredOrders.length === 0 && orders.length > 0 && (
            <div className="empty-state">
              <p>Aucune commande ne correspond aux critères de recherche</p>
            </div>
          )}
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
