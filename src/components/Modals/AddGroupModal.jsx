import { useState } from 'react'
import './AddGroupModal.css'

const API_URL = import.meta.env.VITE_API_URL

const AddGroupModal = ({ isOpen, onClose, onGroupAdded, userId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
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

    if (!formData.name.trim()) {
      setError('Le nom du groupe est obligatoire')
      return
    }

    if (!userId) {
      setError('Utilisateur non identifié')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/v1/groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          created_by: userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la création')
      }

      const newGroup = await response.json()
      console.log('Groupe créé:', newGroup)

      // Réinitialiser le formulaire
      setFormData({ name: '', description: '' })

      // Notifier le composant parent
      onGroupAdded(newGroup)
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
      setFormData({ name: '', description: '' })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un nouveau groupe</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="group-form">
          {error && (
            <div className="form-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">
              Nom du groupe <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ex: Clients VIP, Prospects..."
              maxLength={100}
              required
            />
            <small className="field-hint">
              Le nom du groupe (obligatoire)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Décrivez l'objectif ou les critères de ce groupe..."
              maxLength={500}
              rows={4}
            />
            <small className="field-hint">
              Description optionnelle du groupe (max. 500 caractères)
            </small>
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
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Création...
                </>
              ) : (
                'Créer le groupe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddGroupModal