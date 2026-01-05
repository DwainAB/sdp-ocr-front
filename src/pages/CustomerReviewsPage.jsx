import { useState, useEffect } from 'react'
import './CustomerReviewsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const CustomerReviewsPage = ({ onClose }) => {
  const [reviews, setReviews] = useState([])
  const [filteredReviews, setFilteredReviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [pageSize] = useState(10)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchReviews()
  }, [currentPage, selectedType])

  const getCustomerReviews = async (page = 1, type = null) => {
    try {
      const params = new URLSearchParams({ page, size: pageSize })
      if (type) params.append('review_type', type)

      const response = await fetch(`${API_URL}/api/v1/customer-reviews/?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }

  const deleteCustomer = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      return true
    } catch (error) {
      throw error
    }
  }

  const validateCustomer = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}/transfer`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la validation')
      }

      return await response.json() // contient customer_id du nouveau client
    } catch (error) {
      throw error
    }
  }

  const updateCustomerReview = async (reviewId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la modification')
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }

  const fetchReviews = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getCustomerReviews(currentPage, selectedType || null)
      setReviews(data.customers || [])
      setTotalReviews(data.total || 0)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setError('Erreur lors du chargement des clients en attente')
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return
    }

    try {
      await deleteCustomer(reviewId)
      // Recharger la liste
      fetchReviews()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression du client')
    }
  }

  const handleValidate = async (reviewId) => {
    if (!confirm('Êtes-vous sûr de vouloir valider ce client ?')) {
      return
    }

    try {
      const result = await validateCustomer(reviewId)
      console.log('Client validé, nouveau customer_id:', result.customer_id)
      // Recharger la liste
      fetchReviews()
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      setError('Erreur lors de la validation du client')
    }
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      job: customer.job || '',
      country: customer.country || '',
      city: customer.city || '',
      reference: customer.reference || ''
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    try {
      await updateCustomerReview(editingCustomer.id, editForm)
      setShowEditModal(false)
      setEditingCustomer(null)
      setEditForm({})
      fetchReviews() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setError('Erreur lors de la modification du client')
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingCustomer(null)
    setEditForm({})
  }

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const totalPages = Math.ceil(totalReviews / pageSize)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="customer-reviews-page">
      <div className="reviews-header">
        <div className="header-left">
          <button className="back-btn" onClick={onClose} title="Retour à la liste des clients">
            ←
          </button>
          <div className="header-info">
            <h2>Clients en attente de validation</h2>
            <p className="warning-text">
              Liste temporaire des clients à valider ou supprimer ({totalReviews} en attente)
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchReviews} title="Actualiser">
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des clients en attente...
          </span>
        </div>
      ) : (
        <div className="reviews-content">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Aucun client en attente</h3>
              <p>Tous les clients ont été traités.</p>
            </div>
          ) : (
            <div className="reviews-table-container">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Ville</th>
                    <th>Pays</th>
                    <th>Référence</th>
                    <th>Métier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="review-row" onClick={() => handleEditCustomer(review)}>
                      <td>
                        <span className={`type-badge ${review.type || 'unknown'}`}>
                          {review.type || 'N/A'}
                        </span>
                      </td>
                      <td>{review.first_name || 'N/A'}</td>
                      <td>{review.last_name || 'N/A'}</td>
                      <td>
                        <div className="email-cell">
                          <span className="email-address">{review.email || 'N/A'}</span>
                          {review.verified_email === '1' && (
                            <span className="verified-badge" title="Email vérifié">✓</span>
                          )}
                        </div>
                      </td>
                      <td>{review.phone || 'N/A'}</td>
                      <td>{review.city || 'N/A'}</td>
                      <td>{review.country || 'N/A'}</td>
                      <td>{review.reference || 'N/A'}</td>
                      <td>{review.job || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="validate-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleValidate(review.id)
                            }}
                            title="Valider ce client"
                          >
                            ✓
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(review.id)
                            }}
                            title="Supprimer ce client"
                          >
                            ✗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Page {currentPage} sur {totalPages} · {totalReviews} clients en attente
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
      )}

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Modifier le client</h3>
              <button className="close-btn" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                    placeholder="Prénom"
                  />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => handleFormChange('last_name', e.target.value)}
                    placeholder="Nom"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="Email"
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="Téléphone"
                  />
                </div>
                <div className="form-group">
                  <label>Métier</label>
                  <input
                    type="text"
                    value={editForm.job}
                    onChange={(e) => handleFormChange('job', e.target.value)}
                    placeholder="Métier"
                  />
                </div>
                <div className="form-group">
                  <label>Pays</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => handleFormChange('country', e.target.value)}
                    placeholder="Pays"
                  />
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    placeholder="Ville"
                  />
                </div>
                <div className="form-group">
                  <label>Référence</label>
                  <input
                    type="text"
                    value={editForm.reference}
                    onChange={(e) => handleFormChange('reference', e.target.value)}
                    placeholder="Référence"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancelEdit}>
                Annuler
              </button>
              <button className="save-btn" onClick={handleSaveEdit}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerReviewsPage