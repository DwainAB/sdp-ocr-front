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
    // Section BDD Client
    customers_access: false,
    customers_edit: false,
    formula_edit: false,
    email_sending: false,
    csv_download_limit: '',
    // Section Extraction PDF
    access_to_extraction: false,
    pdf_extraction_limit: '',
    // Autres
    customers_review_access: false,
    full_access: false
  })
  // États locaux pour les toggles d'affichage
  const [showCsvInput, setShowCsvInput] = useState(false)
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
      console.log('Rôles reçus de l\'API:', data)
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
      customers_access: false,
      customers_edit: false,
      formula_edit: false,
      email_sending: false,
      csv_download_limit: '',
      access_to_extraction: false,
      pdf_extraction_limit: '',
      customers_review_access: false,
      full_access: false
    })
    setShowCsvInput(false)
    setEditingRole(null)
    setShowForm(false)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }

      // Si on décoche customers_access, on désactive toutes les sous-options
      if (name === 'customers_access' && !checked) {
        newData.customers_edit = false
        newData.formula_edit = false
        newData.email_sending = false
        newData.csv_download_limit = ''
        setShowCsvInput(false)
      }

      // Si on décoche access_to_extraction, on remet pdf à vide
      if (name === 'access_to_extraction' && !checked) {
        newData.pdf_extraction_limit = ''
      }

      return newData
    })
  }

  const handleCsvToggle = (checked) => {
    setShowCsvInput(checked)
    if (!checked) {
      setFormData(prev => ({
        ...prev,
        csv_download_limit: ''
      }))
    }
  }

  const handleFullAccessChange = (checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        full_access: true,
        customers_access: true,
        customers_edit: true,
        formula_edit: true,
        email_sending: true,
        csv_download_limit: '9999',
        access_to_extraction: true,
        pdf_extraction_limit: '9999',
        customers_review_access: true
      }))
      setShowCsvInput(true)
    } else {
      setFormData(prev => ({
        ...prev,
        full_access: false
      }))
    }
  }

  const validateForm = () => {
    // Vérifier que csv_download_limit est un nombre valide si renseigné
    if (showCsvInput && formData.csv_download_limit !== '') {
      const csvValue = formData.csv_download_limit.toString().trim()
      if (csvValue !== '' && (isNaN(csvValue) || parseInt(csvValue) < 0)) {
        return 'Le nombre de CSV doit être un nombre positif'
      }
    }

    // Vérifier que pdf_extraction_limit est un nombre valide si renseigné
    if (formData.access_to_extraction && formData.pdf_extraction_limit !== '') {
      const pdfValue = formData.pdf_extraction_limit.toString().trim()
      if (pdfValue !== '' && (isNaN(pdfValue) || parseInt(pdfValue) < 0)) {
        return 'Le nombre de PDF doit être un nombre positif'
      }
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    // Préparer les données avec conversion en nombres
    const dataToSend = {
      ...formData,
      csv_download_limit: formData.csv_download_limit !== '' ? parseInt(formData.csv_download_limit) : 0,
      pdf_extraction_limit: formData.pdf_extraction_limit !== '' ? parseInt(formData.pdf_extraction_limit) : 0
    }

    // Debug: affiche les données envoyées
    console.log('Données envoyées à l\'API:', dataToSend)

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, dataToSend)
      } else {
        await rolesApi.create(dataToSend)
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
      customers_access: role.customers_access || false,
      customers_edit: role.customers_edit || false,
      formula_edit: role.formula_edit || false,
      email_sending: role.email_sending || false,
      csv_download_limit: role.csv_download_limit ? role.csv_download_limit.toString() : '',
      access_to_extraction: role.access_to_extraction || false,
      pdf_extraction_limit: role.pdf_extraction_limit ? role.pdf_extraction_limit.toString() : '',
      customers_review_access: role.customers_review_access || false,
      full_access: role.full_access || false
    })
    setShowCsvInput(role.csv_download_limit > 0)
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
              <div className="role-form-header">
                <h3>{editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}</h3>
              </div>

              {/* Nom du rôle */}
              <div className="form-group name-group">
                <label htmlFor="name">Nom du rôle *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  placeholder="Ex: Administrateur, Éditeur, Lecteur..."
                />
              </div>

              {/* Accès complet - En premier et mis en évidence */}
              <div className="full-access-section">
                <label className="full-access-label">
                  <input
                    type="checkbox"
                    name="full_access"
                    checked={formData.full_access}
                    onChange={(e) => handleFullAccessChange(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <div className="full-access-content">
                    <span className="full-access-title">Donner l'accès complet</span>
                    <span className="full-access-desc">Active toutes les permissions ci-dessous</span>
                  </div>
                </label>
              </div>

              <div className="permissions-sections">
                {/* Section BDD Client */}
                <div className="permission-section">
                  <div className="section-header">
                    <label className="section-toggle">
                      <input
                        type="checkbox"
                        name="customers_access"
                        checked={formData.customers_access}
                        onChange={handleChange}
                        disabled={isSubmitting || formData.full_access}
                      />
                      <span className="section-title">L'utilisateur a accès à la BDD client ?</span>
                    </label>
                  </div>

                  {formData.customers_access && (
                    <div className="section-content">
                      <div className="sub-permissions">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="customers_edit"
                            checked={formData.customers_edit}
                            onChange={handleChange}
                            disabled={isSubmitting || formData.full_access}
                          />
                          <span>Peut modifier ou ajouter un client</span>
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="formula_edit"
                            checked={formData.formula_edit}
                            onChange={handleChange}
                            disabled={isSubmitting || formData.full_access}
                          />
                          <span>Peut modifier une formule</span>
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="email_sending"
                            checked={formData.email_sending}
                            onChange={handleChange}
                            disabled={isSubmitting || formData.full_access}
                          />
                          <span>Peut envoyer des emails à un client</span>
                        </label>

                        <div className="csv-permission">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={showCsvInput}
                              onChange={(e) => handleCsvToggle(e.target.checked)}
                              disabled={isSubmitting || formData.full_access}
                            />
                            <span>Peut télécharger des fichiers CSV</span>
                          </label>

                          {showCsvInput && (
                            <div className="quantity-input">
                              <label>Combien de CSV ?</label>
                              <input
                                type="text"
                                name="csv_download_limit"
                                value={formData.csv_download_limit}
                                onChange={handleChange}
                                disabled={isSubmitting || formData.full_access}
                                placeholder="Ex: 100"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Extraction PDF */}
                <div className="permission-section">
                  <div className="section-header">
                    <label className="section-toggle">
                      <input
                        type="checkbox"
                        name="access_to_extraction"
                        checked={formData.access_to_extraction}
                        onChange={handleChange}
                        disabled={isSubmitting || formData.full_access}
                      />
                      <span className="section-title">L'utilisateur peut extraire des données via PDF ?</span>
                    </label>
                  </div>

                  {formData.access_to_extraction && (
                    <div className="section-content">
                      <div className="quantity-input standalone">
                        <label>Combien de PDF ?</label>
                        <input
                          type="text"
                          name="pdf_extraction_limit"
                          value={formData.pdf_extraction_limit}
                          onChange={handleChange}
                          disabled={isSubmitting || formData.full_access}
                          placeholder="Ex: 50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Autres permissions */}
                <div className="permission-section">
                  <div className="section-header">
                    <span className="section-title-static">Autres permissions</span>
                  </div>
                  <div className="section-content always-visible">
                    <div className="sub-permissions">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="customers_review_access"
                          checked={formData.customers_review_access}
                          onChange={handleChange}
                          disabled={isSubmitting || formData.full_access}
                        />
                        <span>Accès aux revues clients</span>
                      </label>
                    </div>
                  </div>
                </div>
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
                    editingRole ? 'Modifier le rôle' : 'Créer le rôle'
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
                      <th>Nom du rôle</th>
                      <th>BDD Client</th>
                      <th>Extraction PDF</th>
                      <th>Emails</th>
                      <th>CSV</th>
                      <th>Revues</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className={role.full_access ? 'full-access-row' : ''}>
                        <td className="role-name">
                          <span>{role.name}</span>
                          {role.full_access === true && <span className="badge-admin">Admin</span>}
                        </td>
                        <td className="role-permission">
                          <span className={`permission-badge ${role.customers_access ? 'active' : 'inactive'}`}>
                            {role.customers_access ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="role-permission">
                          <span className={`permission-badge ${role.access_to_extraction ? 'active' : 'inactive'}`}>
                            {role.access_to_extraction ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="role-permission">
                          <span className={`permission-badge ${role.email_sending ? 'active' : 'inactive'}`}>
                            {role.email_sending ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="role-permission">
                          <span className={`permission-badge ${role.csv_download_limit > 0 ? 'active' : 'inactive'}`}>
                            {role.csv_download_limit > 0 ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="role-permission">
                          <span className={`permission-badge ${role.customers_review_access ? 'active' : 'inactive'}`}>
                            {role.customers_review_access ? '✓' : '✗'}
                          </span>
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
                              >
                                Modifier
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => setDeleteConfirm(role.id)}
                              >
                                Supprimer
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
