import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { usersApi } from '../../../services/api'
import './UserDetailsModal.css'

const UserDetailsModal = ({ isOpen, onClose, onUserUpdated, user, onViewLogs }) => {
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    team: '',
    job: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        team: user.team || '',
        job: user.job || ''
      })
      setIsEditing(false)
      setError('')
    }
  }, [user, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    setError('')

    try {
      // Créer un objet avec seulement les champs modifiés
      const originalData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        team: user.team || '',
        job: user.job || ''
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

      const updatedUser = await usersApi.update(user.id, changedFields)
      console.log('Utilisateur mis à jour:', updatedUser)

      onUserUpdated(updatedUser)
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
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || '',
      team: user?.team || '',
      job: user?.job || ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="user-details-overlay" onClick={handleClose}>
      <div className="user-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{isEditing ? 'Modifier l\'utilisateur' : 'Détails de l\'utilisateur'}</h2>
            <div className="user-id">ID: {user?.id}</div>
          </div>
          <div className="header-actions">
            {!isEditing && currentUser?.role?.full_access && (
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
            <div className="user-info">
              <div className="info-section">
                <h3>Informations personnelles</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Prénom</label>
                    <span>{user?.first_name || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Nom</label>
                    <span>{user?.last_name || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{user?.email || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <span>{user?.phone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Informations professionnelles</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Rôle</label>
                    <span>{user?.role || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Équipe</label>
                    <span>{user?.team || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Poste</label>
                    <span>{user?.job || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {currentUser?.role?.full_access && (
                <div className="simple-action-button">
                  <button
                    className="log-btn"
                    onClick={() => onViewLogs && onViewLogs(user)}
                  >
                    📋 Historique de connexion
                  </button>
                </div>
              )}

            </div>
          ) : (
            // Mode édition - Formulaire
            <div className="user-form">
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
                    placeholder="Ex: Jean"
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
                    placeholder="Ex: Dupont"
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
                  placeholder="Ex: jean.dupont@entreprise.com"
                />
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
                  <label htmlFor="role">Rôle</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Administrateur"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="team">Équipe</label>
                  <input
                    type="text"
                    id="team"
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Développement"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job">Poste</label>
                  <input
                    type="text"
                    id="job"
                    name="job"
                    value={formData.job}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ex: Lead Developer"
                  />
                </div>
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

export default UserDetailsModal