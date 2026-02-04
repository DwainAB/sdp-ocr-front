import { useState, useEffect } from 'react'
import './CustomerReviewsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const TOP_NOTES_OPTIONS = [
  'Bambou', 'Bergamote', 'Bergamote verte', 'Cardamome ginger', 'Citron amère', 'Citron doux',
  "Fleur d'oranger", 'Florale fraîche', 'Freesia', 'Fruit de cassis', 'Géranium sauvage',
  'Gingembre', 'Grenadier', 'Lavande sauvage', 'Lotus', 'Mandarine portofino', 'Note verte',
  'Oeillet fleuri', 'Orange', 'Orange amère', 'Ozone', 'Pamplemousse', 'Poivre sichuan',
  'Pomme', 'Rose de mai', 'Spice bang', 'Thé vert'
]

const HEART_NOTES_OPTIONS = [
  'Cocktail', 'Concombre', 'Figue', 'Fleur de jacinthe', 'Fleur de pêche', 'Fleur de tiaré',
  'Geranium', 'Glycine', 'Hedione', 'Jasmin musqué', 'Jasmin oriental', 'Jonquille', 'Lylibell',
  'Mangue', 'Marine', 'Muguet musqué', 'Mure', 'Note cannelle', 'Note safran', 'Oeillet cuir',
  'Oeillet fruité', 'Pivoine', 'Rhubarbe', 'Romarin', "Rose d'orient", 'Rose fruitée cerise',
  'Tabac blond', 'Tabac gris', 'Tilleul', 'Violette', 'Ylang coton'
]

const BASE_NOTES_OPTIONS = [
  'Accord musc', 'Amande', 'Ambre', 'Ambre oriental', 'Ambre vert', 'Ambreine', 'Bois ambré',
  'Bois booster', 'Bois de cachemire', 'Bois épicé', 'Boisé ambre', 'Boisé cèdre', 'Bouquet fleuri',
  'Cèdre', 'Chocolat au lait', 'Coco des îles', 'Cuir', 'Fève tonka', 'Fleur de jasmin',
  'Frangipane', 'Iris', 'Lilas', 'Mousse', 'Musc blanc', 'Musc floral', 'Myrrhe encens',
  'Note praline', 'Opoponax', "Oud d'or", 'Patchouli', "Poudre d'iris", 'Santal',
  "Santal d'Inde", "Santal d'orient", 'Santal exotique', 'Santaline', 'Tonka', 'Tubereuse',
  'Vanille', 'Vetiver', 'Virginia'
]

const ALL_NOTES_OPTIONS = [...TOP_NOTES_OPTIONS, ...HEART_NOTES_OPTIONS, ...BASE_NOTES_OPTIONS]

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
  const [formulas, setFormulas] = useState([])
  const [editingFormulas, setEditingFormulas] = useState([])
  const [modalError, setModalError] = useState('')
  const [selectedFormula, setSelectedFormula] = useState(null)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

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

  const updateFormulaNotes = async (formulaId, notesData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/formulas/${formulaId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notesData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la modification des notes')
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

  const handleEditCustomer = async (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      job: customer.job || '',
      country: customer.country || '',
      city: customer.city || '',
      reference: customer.reference || '',
      date: customer.date || ''
    })
    setIsEditing(false)
    setShowEditModal(true)
    fetchCustomerReviewFiles(customer.id)
    await fetchCustomerReviewDetails(customer.id)
  }

  const fetchCustomerReviewDetails = async (reviewId) => {
    if (!reviewId) return

    try {
      const response = await fetch(`${API_URL}/api/v1/customer-reviews/${reviewId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails')
      }

      const data = await response.json()
      setFormulas(data.formulas || [])
      setEditingFormulas(JSON.parse(JSON.stringify(data.formulas || []))) // Deep copy
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
      setFormulas([])
      setEditingFormulas([])
    }
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

  const handleFormulaClick = (formula) => {
    setSelectedFormula(formula)
    setShowFormulaModal(true)
  }

  const closeFormulaModal = () => {
    setSelectedFormula(null)
    setShowFormulaModal(false)
  }

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Non renseigné'

    // Si déjà au format JJ/MM/AAAA, retourner tel quel
    const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (ddmmyyyyRegex.test(dateString)) {
      return dateString
    }

    // Essayer de parser d'autres formats et convertir en JJ/MM/AAAA
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch {
      // Si la conversion échoue, retourner la valeur originale
      return dateString
    }

    return dateString
  }

  const validateDateFormat = (dateString) => {
    if (!dateString) return true // Vide est accepté
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(dateRegex)

    if (!match) return false

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    // Vérifier que le mois est valide (01-12)
    if (month < 1 || month > 12) return false

    // Vérifier que le jour est valide (01-31)
    if (day < 1 || day > 31) return false

    // Vérifier les jours selon le mois
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    // Année bissextile
    if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
      return day <= 29
    }

    return day <= daysInMonth[month - 1]
  }

  const handleSaveEdit = async () => {
    // Valider le format de la date avant de soumettre
    if (editForm.date && !validateDateFormat(editForm.date)) {
      setModalError('Le format de la date doit être JJ/MM/AAAA (ex: 15/03/2024)')
      return
    }

    try {
      setModalError('') // Réinitialiser l'erreur

      // Sauvegarder les informations client
      await updateCustomerReview(editingCustomer.id, editForm)

      // Sauvegarder les formules modifiées
      for (const formula of editingFormulas) {
        await updateFormulaNotes(formula.id, {
          top_notes: formula.top_notes,
          heart_notes: formula.heart_notes,
          base_notes: formula.base_notes
        })
      }

      setIsEditing(false)
      fetchReviews() // Recharger la liste
      // Re-fetch les données du client édité
      await fetchCustomerReviewDetails(editingCustomer.id)
      const updatedReview = reviews.find(r => r.id === editingCustomer.id)
      if (updatedReview) {
        setEditingCustomer({ ...editingCustomer, ...editForm })
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setModalError('Erreur lors de la modification du client ou de la formule')
    }
  }

  const handleCancelEdit = () => {
    if (isEditing) {
      setIsEditing(false)
      setModalError('')
      setEditForm({
        first_name: editingCustomer?.first_name || '',
        last_name: editingCustomer?.last_name || '',
        email: editingCustomer?.email || '',
        phone: editingCustomer?.phone || '',
        job: editingCustomer?.job || '',
        country: editingCustomer?.country || '',
        city: editingCustomer?.city || '',
        reference: editingCustomer?.reference || '',
        date: editingCustomer?.date || ''
      })
      // Restaurer les formules originales
      setEditingFormulas(JSON.parse(JSON.stringify(formulas)))
    } else {
      setShowEditModal(false)
      setEditingCustomer(null)
      setEditForm({})
      setCustomerFiles([])
      setLightboxImage(null)
      setFormulas([])
      setEditingFormulas([])
      setModalError('')
    }
  }

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNoteChange = (formulaIndex, noteType, noteIndex, field, value) => {
    setEditingFormulas(prev => {
      const updated = [...prev]
      updated[formulaIndex][noteType][noteIndex][field] = value
      return updated
    })
  }

  const handleAddNote = (formulaIndex, noteType) => {
    setEditingFormulas(prev => {
      const updated = [...prev]
      updated[formulaIndex][noteType].push({ name: '', quantity: '' })
      return updated
    })
  }

  const handleRemoveNote = (formulaIndex, noteType, noteIndex) => {
    setEditingFormulas(prev => {
      const updated = [...prev]
      updated[formulaIndex][noteType].splice(noteIndex, 1)
      return updated
    })
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
                            <label>Date</label>
                            <span>{formatDateDisplay(editingCustomer?.date)}</span>
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
                            <label>Date</label>
                            <input
                              type="text"
                              value={editForm.date}
                              onChange={(e) => handleFormChange('date', e.target.value)}
                              placeholder="Ex: 15/03/2024"
                              className={modalError.includes('date') ? 'input-error' : ''}
                            />
                            {modalError.includes('date') && (
                              <span className="error-message">{modalError}</span>
                            )}
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

              {/* Section Formule - Pleine largeur en dessous */}
              {!isEditing && formulas.length > 0 && (
                <div className="formula-section-full-width">
                  <div className="info-section">
                    <h4>Formule</h4>
                    {formulas.map((formula) => (
                      <div key={formula.id} className="formula-container">
                        <div className="formula-notes-grid">
                          {/* Notes de tête */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de tête</h5>
                            {formula.top_notes?.length > 0 ? (
                              <ul className="notes-list">
                                {formula.top_notes.map((note, idx) => (
                                  <li key={note.id || idx} className="note-item">
                                    <span className="note-name">{note.name}</span>
                                    <span className="note-quantity">{note.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="no-notes">Aucune note</p>
                            )}
                          </div>

                          {/* Notes de cœur */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de cœur</h5>
                            {formula.heart_notes?.length > 0 ? (
                              <ul className="notes-list">
                                {formula.heart_notes.map((note, idx) => (
                                  <li key={note.id || idx} className="note-item">
                                    <span className="note-name">{note.name}</span>
                                    <span className="note-quantity">{note.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="no-notes">Aucune note</p>
                            )}
                          </div>

                          {/* Notes de fond */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de fond</h5>
                            {formula.base_notes?.length > 0 ? (
                              <ul className="notes-list">
                                {formula.base_notes.map((note, idx) => (
                                  <li key={note.id || idx} className="note-item">
                                    <span className="note-name">{note.name}</span>
                                    <span className="note-quantity">{note.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="no-notes">Aucune note</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Formule en mode édition - Pleine largeur en dessous */}
              {isEditing && editingFormulas.length > 0 && (
                <div className="formula-section-full-width">
                  <div className="info-section">
                    <h4>Formule</h4>
                    {editingFormulas.map((formula, formulaIndex) => (
                      <div key={formula.id} className="formula-container">
                        <div className="formula-notes-grid">
                          {/* Notes de tête */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de tête</h5>
                            <div className="notes-edit-list">
                              {formula.top_notes?.map((note, noteIndex) => (
                                <div key={note.id || noteIndex} className="note-edit-item">
                                  <select
                                    className="note-name-input"
                                    value={note.name}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'top_notes',
                                        noteIndex,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">-- Choisir --</option>
                                    {note.name && !ALL_NOTES_OPTIONS.includes(note.name) && (
                                      <option value={note.name}>{note.name}</option>
                                    )}
                                    <optgroup label="Notes de Tête">
                                      {TOP_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Cœur">
                                      {HEART_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Fond">
                                      {BASE_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  <input
                                    type="text"
                                    className="note-quantity-input"
                                    value={note.quantity}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'top_notes',
                                        noteIndex,
                                        'quantity',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Qté"
                                  />
                                  <button
                                    type="button"
                                    className="note-remove-btn"
                                    onClick={() =>
                                      handleRemoveNote(formulaIndex, 'top_notes', noteIndex)
                                    }
                                    title="Supprimer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="note-add-btn"
                                onClick={() => handleAddNote(formulaIndex, 'top_notes')}
                              >
                                + Ajouter une note
                              </button>
                            </div>
                          </div>

                          {/* Notes de cœur */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de cœur</h5>
                            <div className="notes-edit-list">
                              {formula.heart_notes?.map((note, noteIndex) => (
                                <div key={note.id || noteIndex} className="note-edit-item">
                                  <select
                                    className="note-name-input"
                                    value={note.name}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'heart_notes',
                                        noteIndex,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">-- Choisir --</option>
                                    {note.name && !ALL_NOTES_OPTIONS.includes(note.name) && (
                                      <option value={note.name}>{note.name}</option>
                                    )}
                                    <optgroup label="Notes de Tête">
                                      {TOP_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Cœur">
                                      {HEART_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Fond">
                                      {BASE_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  <input
                                    type="text"
                                    className="note-quantity-input"
                                    value={note.quantity}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'heart_notes',
                                        noteIndex,
                                        'quantity',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Qté"
                                  />
                                  <button
                                    type="button"
                                    className="note-remove-btn"
                                    onClick={() =>
                                      handleRemoveNote(formulaIndex, 'heart_notes', noteIndex)
                                    }
                                    title="Supprimer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="note-add-btn"
                                onClick={() => handleAddNote(formulaIndex, 'heart_notes')}
                              >
                                + Ajouter une note
                              </button>
                            </div>
                          </div>

                          {/* Notes de fond */}
                          <div className="notes-column">
                            <h5 className="notes-title">Notes de fond</h5>
                            <div className="notes-edit-list">
                              {formula.base_notes?.map((note, noteIndex) => (
                                <div key={note.id || noteIndex} className="note-edit-item">
                                  <select
                                    className="note-name-input"
                                    value={note.name}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'base_notes',
                                        noteIndex,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">-- Choisir --</option>
                                    {note.name && !ALL_NOTES_OPTIONS.includes(note.name) && (
                                      <option value={note.name}>{note.name}</option>
                                    )}
                                    <optgroup label="Notes de Tête">
                                      {TOP_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Cœur">
                                      {HEART_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Notes de Fond">
                                      {BASE_NOTES_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  <input
                                    type="text"
                                    className="note-quantity-input"
                                    value={note.quantity}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        formulaIndex,
                                        'base_notes',
                                        noteIndex,
                                        'quantity',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Qté"
                                  />
                                  <button
                                    type="button"
                                    className="note-remove-btn"
                                    onClick={() =>
                                      handleRemoveNote(formulaIndex, 'base_notes', noteIndex)
                                    }
                                    title="Supprimer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="note-add-btn"
                                onClick={() => handleAddNote(formulaIndex, 'base_notes')}
                              >
                                + Ajouter une note
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {modalError && !modalError.includes('date') && (
                    <div className="modal-error-banner">
                      <span>⚠️ {modalError}</span>
                    </div>
                  )}

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

          {/* Modal pour afficher une formule spécifique avec son fichier */}
          {showFormulaModal && selectedFormula && (
            <div className="modal-overlay" onClick={closeFormulaModal}>
              <div className="formula-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Formule {selectedFormula.id}</h3>
                  <button className="close-btn" onClick={closeFormulaModal}>×</button>
                </div>

                <div className="modal-body">
                  <div className="formula-detail-layout-review">
                    {/* Section Fichier associé */}
                    <div className="formula-file-section">
                      <h4>Document associé</h4>
                      {selectedFormula.file_id && customerFiles.find(f => f.id === selectedFormula.file_id) ? (
                        <div className="formula-file-preview">
                          <img
                            src={`${API_URL}/api/v1/files/${selectedFormula.file_id}/content`}
                            alt={`Fichier ${selectedFormula.file_id}`}
                            className="formula-preview-image"
                            onClick={() => openLightbox(customerFiles.find(f => f.id === selectedFormula.file_id))}
                          />
                        </div>
                      ) : (
                        <div className="no-files">
                          <span className="no-files-icon">📄</span>
                          <p>Aucun document associé</p>
                        </div>
                      )}
                    </div>

                    {/* Section Formule */}
                    <div className="formula-notes-section">
                      <h4>Composition de la formule</h4>
                      <div className="formula-notes-grid">
                        {/* Notes de tête */}
                        <div className="notes-column">
                          <h5 className="notes-title">Notes de tête</h5>
                          {selectedFormula.top_notes?.length > 0 ? (
                            <ul className="notes-list">
                              {selectedFormula.top_notes.map((note, idx) => (
                                <li key={note.id || idx} className="note-item">
                                  <span className="note-name">{note.name}</span>
                                  <span className="note-quantity">{note.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-notes">Aucune note</p>
                          )}
                        </div>

                        {/* Notes de cœur */}
                        <div className="notes-column">
                          <h5 className="notes-title">Notes de cœur</h5>
                          {selectedFormula.heart_notes?.length > 0 ? (
                            <ul className="notes-list">
                              {selectedFormula.heart_notes.map((note, idx) => (
                                <li key={note.id || idx} className="note-item">
                                  <span className="note-name">{note.name}</span>
                                  <span className="note-quantity">{note.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-notes">Aucune note</p>
                          )}
                        </div>

                        {/* Notes de fond */}
                        <div className="notes-column">
                          <h5 className="notes-title">Notes de fond</h5>
                          {selectedFormula.base_notes?.length > 0 ? (
                            <ul className="notes-list">
                              {selectedFormula.base_notes.map((note, idx) => (
                                <li key={note.id || idx} className="note-item">
                                  <span className="note-name">{note.name}</span>
                                  <span className="note-quantity">{note.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-notes">Aucune note</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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