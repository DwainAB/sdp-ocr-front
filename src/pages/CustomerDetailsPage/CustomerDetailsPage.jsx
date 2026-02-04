import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './CustomerDetailsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const CustomerDetailsPage = ({ customerId, onBack, onCustomerUpdated, onOpenFormula }) => {
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job: '',
    city: '',
    country: '',
    reference: '',
    date: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [formulas, setFormulas] = useState([])

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails(customerId)
    }
  }, [customerId])

  const fetchCustomerDetails = async (id) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/v1/customers/${id}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du client')
      }
      const data = await response.json()
      setCustomer(data)
      setFormulas(data.formulas || [])
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        job: data.job || '',
        city: data.city || '',
        country: data.country || '',
        reference: data.reference || '',
        date: data.date || ''
      })
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des détails du client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormulaClick = (formula) => {
    if (onOpenFormula) {
      onOpenFormula(formula.id)
    }
  }

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Non renseigné'

    const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (ddmmyyyyRegex.test(dateString)) {
      return dateString
    }

    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch {
      return dateString
    }

    return dateString
  }

  const validateDateFormat = (dateString) => {
    if (!dateString) return true
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(dateRegex)

    if (!match) return false

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
      return day <= 29
    }

    return day <= daysInMonth[month - 1]
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'date' && value) {
      if (!value) {
        setError('')
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customer?.id) return

    if (formData.date && !validateDateFormat(formData.date)) {
      setError('Le format de la date doit être JJ/MM/AAAA (ex: 15/03/2024)')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const originalData = {
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        job: customer.job || '',
        city: customer.city || '',
        country: customer.country || '',
        reference: customer.reference || '',
        date: customer.date || ''
      }

      const changedFields = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key]
        }
      })

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
      setCustomer(updatedCustomer)
      setIsEditing(false)

      if (onCustomerUpdated) {
        onCustomerUpdated(updatedCustomer)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
    setFormData({
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      job: customer?.job || '',
      city: customer?.city || '',
      country: customer?.country || '',
      reference: customer?.reference || '',
      date: customer?.date || ''
    })
  }

  if (isLoading) {
    return (
      <div className="section-content">
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des détails du client...
          </span>
        </div>
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="section-content">
        <div className="section-header">
          <div>
            <button className="back-btn" onClick={onBack}>
              ←
            </button>
          </div>
        </div>
        <div className="file-status">
          <div className="status-indicator error">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-content customer-details-page">
      <div className="section-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ←
          </button>
          <div className="header-title">
            <h2>{isEditing ? 'Modifier le client' : 'Détails du client'}</h2>
            <p>{customer?.first_name} {customer?.last_name}</p>
          </div>
        </div>
        <div className="header-actions">
          {!isEditing && user?.role?.customers_edit && (
            <button
              className="action-btn edit-btn"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
            >
              <span className="btn-icon">✏️</span>
              <span className="btn-tooltip">Modifier</span>
            </button>
          )}
          <button className="action-btn refresh-btn" onClick={() => fetchCustomerDetails(customerId)}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Badges de vérification */}
      <div className="verification-badges-section">
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

      {error && (
        <div className="form-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="customer-info-content">
          <div className="info-sections-container">
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
                  <span>{customer?.email || 'Non renseigné'}</span>
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
                  <label>Créée</label>
                  <span>{formatDateDisplay(customer?.created_at)}</span>
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

          <div className="info-section formulas-section">
            <h3>Formules disponibles ({formulas.length})</h3>
            {formulas.length > 0 ? (
              <div className="formulas-buttons-list">
                {formulas.map((formula) => (
                  <button
                    key={formula.id}
                    className="formula-button"
                    onClick={() => handleFormulaClick(formula)}
                  >
                    {customer?.date ? customer.date : customer?.created_at}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-files">
                <span className="no-files-icon">📋</span>
                <p>Aucune formule disponible pour ce client</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="customer-form-content">
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                  placeholder="Ex: France"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
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
  )
}

export default CustomerDetailsPage
