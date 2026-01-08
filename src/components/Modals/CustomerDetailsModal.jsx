import { useState, useEffect } from 'react'
import './CustomerDetailsModal.css'

const API_URL = import.meta.env.VITE_API_URL

const CustomerDetailsModal = ({ isOpen, onClose, onCustomerUpdated, customer, onViewLogs }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job: '',
    city: '',
    country: '',
    reference: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [customerFiles, setCustomerFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        job: customer.job || '',
        city: customer.city || '',
        country: customer.country || '',
        reference: customer.reference || ''
      })
      setIsEditing(false)
      setError('')

      // Charger les fichiers du client
      fetchCustomerFiles(customer.id)
    }
  }, [customer, isOpen])

  const fetchCustomerFiles = async (customerId) => {
    if (!customerId) return

    setFilesLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/customers/${customerId}/files`)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customer?.id) return

    setIsLoading(true)
    setError('')

    try {
      // Créer un objet avec seulement les champs modifiés
      const originalData = {
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        job: customer.job || '',
        city: customer.city || '',
        country: customer.country || '',
        reference: customer.reference || ''
      }

      const changedFields = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key]
        }
      })

      // Ne rien envoyer si aucun changement
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false)
        return
      }

      const response = await fetch(`${API_URL}/api/v1/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changedFields)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour')
      }

      const updatedCustomer = await response.json()
      console.log('Client mis à jour:', updatedCustomer)

      onCustomerUpdated(updatedCustomer)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError('')
      setIsEditing(false)
      setLightboxImage(null)
      onClose()
    }
  }

  const openLightbox = (file) => {
    setLightboxImage(file)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
    // Réinitialiser le formulaire avec les données originales
    setFormData({
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      job: customer?.job || '',
      city: customer?.city || '',
      country: customer?.country || '',
      reference: customer?.reference || ''
    })
  }


  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="customer-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{isEditing ? 'Modifier le client' : 'Détails du client'}</h2>
            <div className="verification-badges">
              {customer?.verified_email && (
                <span className="verification-badge verified" title="Email vérifié">
                  ✓ Email vérifié
                </span>
              )}
              {customer?.verified_email === false && (
                <span className="verification-badge unverified" title="Email non vérifié">
                  ✗ Email non vérifié
                </span>
              )}
              {customer?.verified_phone && (
                <span className="verification-badge verified" title="Téléphone vérifié">
                  ✓ Téléphone vérifié
                </span>
              )}
              {customer?.verified_phone === false && (
                <span className="verification-badge unverified" title="Téléphone non vérifié">
                  ✗ Téléphone non vérifié
                </span>
              )}
              {customer?.verified_domain && (
                <span className="verification-badge verified" title="Domaine vérifié">
                  ✓ Domaine vérifié
                </span>
              )}
              {customer?.verified_domain === false && (
                <span className="verification-badge unverified" title="Domaine non vérifié">
                  ✗ Domaine non vérifié
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            {!isEditing && (
              <button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                ✏️ Modifier
              </button>
            )}
            <button
              className="modal-close-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {error && (
            <div className="form-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!isEditing ? (
            // Mode lecture - Affichage des informations
            <div className="customer-info">
              <div className="info-section">
                <h3>Informations personnelles</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Prénom</label>
                    <span>{customer?.first_name || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Nom</label>
                    <span>{customer?.last_name || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <div className="email-info">
                      <span>{customer?.email || 'Non renseigné'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <div className="email-info">
                      <span>{customer?.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Métier</label>
                    <span>{customer?.job || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Référence</label>
                    <span>{customer?.reference || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Localisation</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Ville</label>
                    <span>{customer?.city || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Pays</label>
                    <span>{customer?.country || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {/* Section des fichiers */}
              <div className="info-section files-section">
                <h3>Documents & Images ({customerFiles.length})</h3>
                {filesLoading ? (
                  <div className="files-loading">
                    <span className="spinner"></span>
                    <span>Chargement des fichiers...</span>
                  </div>
                ) : customerFiles.length > 0 ? (
                  <div className="files-grid">
                    {customerFiles.map(file => (
                      <div key={file.id} className="file-item">
                        <img
                          src={`${API_URL}/api/v1/files/${file.id}/content`}
                          alt={file.file_name}
                          className="file-thumbnail"
                          loading="lazy"
                          onClick={() => openLightbox(file)}
                        />
                        <div className="file-info">
                          <p className="file-name" title={file.file_name}>
                            {file.file_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">
                    <span className="no-files-icon">📄</span>
                    <p>Aucun fichier disponible pour ce client</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            // Mode édition - Formulaire
            <div className="customer-form">
              <form onSubmit={handleSubmit} className="form-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Prénom</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Marie"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Nom</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Dubois"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Ex: marie.dubois@example.com"
                />
                <small className="field-hint">
                  La modification de l'email déclenchera une nouvelle vérification automatique
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job">Métier</label>
                  <input
                    type="text"
                    id="job"
                    name="job"
                    value={formData.job}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Designer"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Ville</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Paris"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Pays</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: France"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reference">Référence</label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Ex: REF-2024-001"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour'
                  )}
                </button>
              </div>
            </form>
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
    </div>
  )
}

export default CustomerDetailsModal