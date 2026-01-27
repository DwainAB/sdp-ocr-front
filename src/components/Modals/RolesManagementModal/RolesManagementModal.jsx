import { useState, useEffect } from 'react'
import { rolesApi } from '../../../services/api'
import './RolesManagementModal.css'

const RolesManagementModal = ({ isOpen, onClose, onRolesUpdated }) => {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    csv: 0,
    pdf: 0,
    email_sending: false,
    customer_validation: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  const fetchRoles = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await rolesApi.getAll()
      setRoles(data.roles || data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error)
      setError('Erreur lors du chargement des rôles')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      csv: 0,
      pdf: 0,
      email_sending: false,
      customer_validation: false
    })
    setEditingRole(null)
    setShowForm(false)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData)
      } else {
        await rolesApi.create(formData)
      }

      await fetchRoles()
      resetForm()

      if (onRolesUpdated) {
        onRolesUpdated()
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    setFormData({
      name: role.name || '',
      csv: role.csv || 0,
      pdf: role.pdf || 0,
      email_sending: role.email_sending || false,
      customer_validation: role.customer_validation || false
    })
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (roleId) => {
    try {
      await rolesApi.delete(roleId)
      await fetchRoles()
      setDeleteConfirm(null)

      if (onRolesUpdated) {
        onRolesUpdated()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError(error.message)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content roles-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestion des rôles</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="roles-modal-body">
          {error && (
            <div className="form-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!showForm && (
            <div className="roles-header">
              <button
                className="btn-primary add-role-btn"
                onClick={() => setShowForm(true)}
              >
                + Nouveau rôle
              </button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="role-form">
              <h3>{editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}</h3>

              <div className="form-group">
                <label htmlFor="name">Nom du rôle *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  placeholder="Ex: Administrateur"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="csv">Niveau CSV</label>
                  <input
                    type="number"
                    id="csv"
                    name="csv"
                    value={formData.csv}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pdf">Niveau PDF</label>
                  <input
                    type="number"
                    id="pdf"
                    name="pdf"
                    value={formData.pdf}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="email_sending"
                    checked={formData.email_sending}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span>Autoriser l'envoi d'emails</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="customer_validation"
                    checked={formData.customer_validation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span>Autoriser la validation client</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      {editingRole ? 'Modification...' : 'Création...'}
                    </>
                  ) : (
                    editingRole ? 'Modifier' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="roles-list">
            <h3>Rôles existants</h3>

            {isLoading ? (
              <div className="loading-roles">
                <span className="spinner"></span>
                Chargement des rôles...
              </div>
            ) : roles.length === 0 ? (
              <div className="empty-roles">
                <p>Aucun rôle disponible</p>
              </div>
            ) : (
              <div className="roles-table-container">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>CSV</th>
                      <th>PDF</th>
                      <th>Email</th>
                      <th>Validation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td className="role-name">{role.name}</td>
                        <td className="role-level">{role.csv}</td>
                        <td className="role-level">{role.pdf}</td>
                        <td className="role-permission">
                          {role.email_sending ? '✓' : '✗'}
                        </td>
                        <td className="role-permission">
                          {role.customer_validation ? '✓' : '✗'}
                        </td>
                        <td className="role-actions">
                          {deleteConfirm === role.id ? (
                            <div className="delete-confirm">
                              <span>Confirmer ?</span>
                              <button
                                className="btn-confirm-yes"
                                onClick={() => handleDelete(role.id)}
                              >
                                Oui
                              </button>
                              <button
                                className="btn-confirm-no"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                Non
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                className="btn-edit"
                                onClick={() => handleEdit(role)}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => setDeleteConfirm(role.id)}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RolesManagementModal
