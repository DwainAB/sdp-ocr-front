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
  const [isEditing, setIsEditing] = useState(false)
  const [customerFiles, setCustomerFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)

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
    setIsEditing(false)
    setShowEditModal(true)
    fetchCustomerReviewFiles(customer.id)
  }

  const fetchCustomerReviewFiles = async (reviewId) => {
    if (!reviewId) return

    setFilesLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}/files`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des fichiers')
      }

      const data = await response.json()

      // Filtrer uniquement les images PNG
      const imageFiles = data.files.filter(file => file.file_type === 'image/png')
      setCustomerFiles(imageFiles)
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
      setCustomerFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  const openLightbox = (file) => {
    setLightboxImage(file)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const handleSaveEdit = async () => {
    try {
      await updateCustomerReview(editingCustomer.id, editForm)
      setIsEditing(false)
      fetchReviews() // Recharger la liste
      // Re-fetch les données du client édité
      const updatedReview = reviews.find(r => r.id === editingCustomer.id)
      if (updatedReview) {
        setEditingCustomer({ ...editingCustomer, ...editForm })
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setError('Erreur lors de la modification du client')
    }
  }

  const handleCancelEdit = () => {
    if (isEditing) {
      setIsEditing(false)
      setEditForm({
        first_name: editingCustomer?.first_name || '',
        last_name: editingCustomer?.last_name || '',
        email: editingCustomer?.email || '',
        phone: editingCustomer?.phone || '',
        job: editingCustomer?.job || '',
        country: editingCustomer?.country || '',
        city: editingCustomer?.city || '',
        reference: editingCustomer?.reference || ''
      })
    } else {
      setShowEditModal(false)
      setEditingCustomer(null)
      setEditForm({})
      setCustomerFiles([])
      setLightboxImage(null)
    }
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
                      <td>
                        <div className="email-cell">
                          <span className="email-address">{review.phone || 'N/A'}</span>
                          {review.verified_phone === '1' && (
                            <span className="verified-badge" title="Téléphone vérifié">✓</span>
                          )}
                        </div>
                      </td>
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

      {/* Modal de détails client */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h3>{isEditing ? 'Modifier le client' : 'Détails du client en attente'}</h3>
                <div className="verification-badges">
                  {editingCustomer?.verified_email === '1' && (
                    <span className="verification-badge verified">✓ Email vérifié</span>
                  )}
                  {editingCustomer?.verified_email === '0' && (
                    <span className="verification-badge unverified">✗ Email non vérifié</span>
                  )}
                  {editingCustomer?.verified_phone === '1' && (
                    <span className="verification-badge verified">✓ Téléphone vérifié</span>
                  )}
                  {editingCustomer?.verified_phone === '0' && (
                    <span className="verification-badge unverified">✗ Téléphone non vérifié</span>
                  )}
                </div>
              </div>
              <div className="header-actions">
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    ✏️ Modifier
                  </button>
                )}
                <button className="close-btn" onClick={handleCancelEdit}>×</button>
              </div>
            </div>

            <div className="modal-body">
              {/* Layout en deux colonnes (toujours) */}
              <div className="customer-review-layout">
                {/* Colonne gauche - Informations / Formulaire */}
                <div className="customer-info-column">
                  {!isEditing ? (
                    // Mode lecture
                    <>
                      <div className="info-section">
                        <h4>Informations personnelles</h4>
                        <div className="info-list">
                          <div className="info-item">
                            <label>Prénom</label>
                            <span>{editingCustomer?.first_name || 'Non renseigné'}</span>
                          </div>
                          <div className="info-item">
                            <label>Nom</label>
                            <span>{editingCustomer?.last_name || 'Non renseigné'}</span>
                          </div>
                          <div className="info-item">
                            <label>Email</label>
                            <div className="email-info">
                              <span>{editingCustomer?.email || 'Non renseigné'}</span>
                              {editingCustomer?.verified_email === '1' && (
                                <span className="verified-icon" title="Email vérifié">
                                  ✓
                                </span>
                              )}
                              {editingCustomer?.verified_email === '0' && (
                                <span className="unverified-icon" title="Email non vérifié">
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="info-item">
                            <label>Téléphone</label>
                            <div className="email-info">
                              <span>{editingCustomer?.phone || 'Non renseigné'}</span>
                              {editingCustomer?.verified_phone === '1' && (
                                <span className="verified-icon" title="Téléphone vérifié">
                                  ✓
                                </span>
                              )}
                              {editingCustomer?.verified_phone === '0' && (
                                <span className="unverified-icon" title="Téléphone non vérifié">
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="info-item">
                            <label>Métier</label>
                            <span>{editingCustomer?.job || 'Non renseigné'}</span>
                          </div>
                          <div className="info-item">
                            <label>Référence</label>
                            <span>{editingCustomer?.reference || 'Non renseigné'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="info-section">
                        <h4>Localisation</h4>
                        <div className="info-list">
                          <div className="info-item">
                            <label>Ville</label>
                            <span>{editingCustomer?.city || 'Non renseigné'}</span>
                          </div>
                          <div className="info-item">
                            <label>Pays</label>
                            <span>{editingCustomer?.country || 'Non renseigné'}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Mode édition
                    <div className="customer-form">
                      <div className="info-section">
                        <h4>Informations personnelles</h4>
                        <div className="form-grid-single">
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

                      <div className="info-section">
                        <h4>Localisation</h4>
                        <div className="form-grid-single">
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
                            <label>Pays</label>
                            <input
                              type="text"
                              value={editForm.country}
                              onChange={(e) => handleFormChange('country', e.target.value)}
                              placeholder="Pays"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          Annuler
                        </button>
                        <button className="save-btn" onClick={handleSaveEdit}>
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonne droite - Image (toujours visible) */}
                <div className="customer-image-column">
                  <div className="info-section image-section">
                    <h4>Document scanné</h4>
                    {filesLoading ? (
                      <div className="files-loading">
                        <span className="spinner"></span>
                        <span>Chargement...</span>
                      </div>
                    ) : customerFiles.length > 0 ? (
                      <div className="image-preview">
                        <img
                          src={`${API_URL}/api/v1/files/${customerFiles[0].id}/content`}
                          alt={customerFiles[0].file_name}
                          className="preview-image"
                          onClick={() => openLightbox(customerFiles[0])}
                        />
                      </div>
                    ) : (
                      <div className="no-files">
                        <span className="no-files-icon">📄</span>
                        <p>Aucun document disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lightbox pour afficher l'image en grand */}
          {lightboxImage && (
            <div className="lightbox-overlay" onClick={closeLightbox}>
              <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <button className="lightbox-close" onClick={closeLightbox}>
                  ✕
                </button>
                <img
                  src={`${API_URL}/api/v1/files/${lightboxImage.id}/content`}
                  alt={lightboxImage.file_name}
                  className="lightbox-image"
                />
                <div className="lightbox-info">
                  <p>{lightboxImage.file_name}</p>
                  <a
                    href={`${API_URL}/api/v1/files/${lightboxImage.id}/download`}
                    download
                    className="lightbox-download-btn"
                  >
                    ⬇️ Télécharger
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomerReviewsPage