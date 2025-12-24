import { useState } from 'react'
import './AddUserModal.css'

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job: '',
    role: 'user',
    team: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }

      const newUser = await response.json()
      console.log('Utilisateur créé:', newUser)

      // Réinitialiser le formulaire
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job: '',
        role: 'user',
        team: ''
      })

      // Notifier le parent et fermer le modal
      onUserAdded(newUser)
      onClose()
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
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter un membre</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          {error && (
            <div className="form-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Prénom *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ex: Marie"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nom *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ex: Dubois"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Ex: marie.dubois@example.com"
            />
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="job">Poste *</label>
              <input
                type="text"
                id="job"
                name="job"
                value={formData.job}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ex: Designer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Rôle</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="team">Équipe</label>
            <input
              type="text"
              id="team"
              name="team"
              value={formData.team}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ex: Creative"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
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
                  Création...
                </>
              ) : (
                'Créer le membre'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserModal