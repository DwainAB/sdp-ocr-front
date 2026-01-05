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
    }
  }, [customer, isOpen])

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
      onClose()
    }
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
            <div className="client-id">ID: {customer?.id}</div>
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
                      {customer?.verified_email === true && (
                        <span className="verified-icon" title="Email vérifié">
                          ✓
                        </span>
                      )}
                      {customer?.verified_email === false && (
                        <span className="unverified-icon" title="Email non vérifié">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <span>{customer?.phone || 'Non renseigné'}</span>
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
    </div>
  )
}

export default CustomerDetailsModal