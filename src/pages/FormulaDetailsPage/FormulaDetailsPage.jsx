import { useState, useEffect } from 'react'
import EmailTypeModal from '../../components/Modals/EmailTypeModal/EmailTypeModal'
import ActionsModal from '../../components/Modals/ActionsModal/ActionsModal'
import DerivedProductsOrderModal from '../../components/Modals/DerivedProductsOrderModal/DerivedProductsOrderModal'
import './FormulaDetailsPage.css'

const API_URL = import.meta.env.VITE_API_URL

const FormulaDetailsPage = ({ formulaId, customerId, onBack, onFormulaUpdated }) => {
  const [formula, setFormula] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showDerivedProductsModal, setShowDerivedProductsModal] = useState(false)

  // Fonction pour parser une quantité en nombre
  const parseQuantity = (quantity) => {
    if (!quantity) return { value: 0, valid: false }
    const str = String(quantity).trim()

    // Vérifie si c'est un format invalide (contient +, -, ✓, plusieurs nombres, etc.)
    // On accepte uniquement: un nombre simple avec éventuellement une virgule/point décimal
    // et optionnellement une unité à la fin (ml, g, etc.)
    const invalidPatterns = /[+\-×÷✓✗xX*/]|(\d+\s+\d+)/
    if (invalidPatterns.test(str)) {
      return { value: 0, valid: false }
    }

    // Extrait le nombre au début de la chaîne (ex: "10ml" -> "10", "1,5" -> "1.5")
    const match = str.match(/^[\d,.\s]+/)
    if (!match) return { value: 0, valid: false }

    const cleaned = match[0].replace(',', '.').replace(/\s/g, '')
    const parsed = parseFloat(cleaned)
    return { value: isNaN(parsed) ? 0 : parsed, valid: !isNaN(parsed) && cleaned !== '' }
  }

  // Fonction pour calculer les totaux et pourcentages d'une liste de notes
  const calculateNotesStats = (notes) => {
    if (!notes || notes.length === 0) return { total: 0, hasInvalidQuantities: false, invalidNotes: [] }

    let total = 0
    const invalidNotes = []

    notes.forEach(note => {
      const { value, valid } = parseQuantity(note.quantity)
      if (valid) {
        total += value
      } else if (note.quantity && note.quantity.trim() !== '') {
        invalidNotes.push(note.name || 'Note sans nom')
      }
    })

    return { total, hasInvalidQuantities: invalidNotes.length > 0, invalidNotes }
  }

  // Fonction pour calculer le total global de la formule
  const calculateFormulaStats = (data) => {
    if (!data) return { grandTotal: 0, allInvalidNotes: [], hasAnyInvalid: false }

    const topStats = calculateNotesStats(data.top_notes)
    const heartStats = calculateNotesStats(data.heart_notes)
    const baseStats = calculateNotesStats(data.base_notes)

    const grandTotal = topStats.total + heartStats.total + baseStats.total
    const allInvalidNotes = [...topStats.invalidNotes, ...heartStats.invalidNotes, ...baseStats.invalidNotes]

    return {
      grandTotal,
      allInvalidNotes,
      hasAnyInvalid: allInvalidNotes.length > 0,
      topTotal: topStats.total,
      heartTotal: heartStats.total,
      baseTotal: baseStats.total
    }
  }

  useEffect(() => {
    if (formulaId) {
      fetchFormulaDetails(formulaId)
    }
    if (customerId) {
      fetchCustomerDetails(customerId)
    }
  }, [formulaId, customerId])

  const fetchCustomerDetails = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/customers/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error)
    }
  }

  const handleActionSelect = (actionId) => {
    setShowActionsModal(false)
    if (actionId === 'derived-products') {
      setShowDerivedProductsModal(true)
    }
  }

  const fetchFormulaDetails = async (id) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/v1/formulas/${id}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la formule')
      }

      const data = await response.json()
      setFormula(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditFormula = () => {
    setEditingData(JSON.parse(JSON.stringify(formula)))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingData(null)
  }

  const handleNoteChange = (noteType, index, field, value) => {
    setEditingData(prev => {
      const updated = { ...prev }
      updated[noteType] = [...prev[noteType]]
      updated[noteType][index] = { ...updated[noteType][index], [field]: value }
      return updated
    })
  }

  const handleAddNote = (noteType) => {
    setEditingData(prev => {
      const updated = { ...prev }
      updated[noteType] = [...(prev[noteType] || []), { name: '', quantity: '' }]
      return updated
    })
  }

  const handleRemoveNote = (noteType, index) => {
    setEditingData(prev => {
      const updated = { ...prev }
      updated[noteType] = prev[noteType].filter((_, i) => i !== index)
      return updated
    })
  }

  const handleSaveFormula = async () => {
    if (!editingData?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/formulas/${editingData.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          top_notes: editingData.top_notes || [],
          heart_notes: editingData.heart_notes || [],
          base_notes: editingData.base_notes || [],
          comment: editingData.comment || '',
          date: editingData.date || ''
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la formule')
      }

      const updatedFormula = await response.json()
      setFormula(updatedFormula)
      setIsEditing(false)
      setEditingData(null)

      if (onFormulaUpdated) {
        onFormulaUpdated(updatedFormula)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const openLightbox = (file) => {
    setLightboxImage(file)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  if (isLoading) {
    return (
      <div className="section-content formula-details-page">
        <div className="formula-loading-container">
          <div className="formula-loading-content">
            <div className="loading-spinner-large">
              <span className="spinner"></span>
            </div>
            <h3>Chargement de la formule...</h3>
            <p>Veuillez patienter pendant le chargement du document</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !formula) {
    return (
      <div className="section-content formula-details-page">
        <div className="section-header">
          <div className="header-left">
            <button className="back-btn" onClick={onBack}>
              ← Retour au client
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
    <div className="section-content formula-details-page">
      <div className="section-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ← Retour au client
          </button>
          <div className="header-title">
            <h2>Formule {formula?.id || ''}</h2>
            {formula?.date && (
              <span className="formula-date">Date : {formula.date}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {!isEditing && formula && (
            <>
              <button
                className="action-btn add-btn"
                onClick={() => setShowActionsModal(true)}
              >
                <span className="btn-icon">+</span>
                <span className="btn-tooltip">Actions</span>
              </button>
              <button className="action-btn edit-btn" onClick={handleEditFormula}>
                <span className="btn-icon">✏️</span>
                <span className="btn-tooltip">Modifier</span>
              </button>
              <button
                className="action-btn email-btn"
                onClick={() => setShowEmailModal(true)}
              >
                <span className="btn-icon">✉️</span>
                <span className="btn-tooltip">Envoyer par mail</span>
              </button>
            </>
          )}
          <button className="action-btn refresh-btn" onClick={() => fetchFormulaDetails(formulaId)}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {formula && (
        <div className="formula-detail-content">
          {/* Section Document */}
          <div className="formula-file-section">
            <h4>Document associé</h4>
            {formula.id ? (
              <div className="formula-file-preview">
                <img
                  src={`${API_URL}/api/v1/formulas/${formula.id}/file/thumbnail`}
                  alt={`Fichier de la formule ${formula.id}`}
                  className="formula-preview-image"
                  onClick={() => {
                    openLightbox({
                      id: formula.id,
                      file_name: `Formule ${formula.id}`,
                      isFormula: true
                    })
                  }}
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

            {!isEditing ? (
              // Mode lecture
              (() => {
                const stats = calculateFormulaStats(formula)
                return (
                  <>
                    <div className="formula-notes-grid">
                      {/* Notes de tête */}
                      <div className="notes-column">
                        <h5 className="notes-title top-notes-title">Notes de tête</h5>
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
                        {!stats.hasAnyInvalid && formula.top_notes?.length > 0 && (
                          <div className="notes-total">
                            <span className="total-label">Total:</span>
                            <span className="total-value">{stats.topTotal.toFixed(2)} ml</span>
                            {stats.grandTotal > 0 && (
                              <span className="total-percentage">{((stats.topTotal / stats.grandTotal) * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Notes de cœur */}
                      <div className="notes-column">
                        <h5 className="notes-title heart-notes-title">Notes de cœur</h5>
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
                        {!stats.hasAnyInvalid && formula.heart_notes?.length > 0 && (
                          <div className="notes-total">
                            <span className="total-label">Total:</span>
                            <span className="total-value">{stats.heartTotal.toFixed(2)} ml</span>
                            {stats.grandTotal > 0 && (
                              <span className="total-percentage">{((stats.heartTotal / stats.grandTotal) * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Notes de fond */}
                      <div className="notes-column">
                        <h5 className="notes-title base-notes-title">Notes de fond</h5>
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
                        {!stats.hasAnyInvalid && formula.base_notes?.length > 0 && (
                          <div className="notes-total">
                            <span className="total-label">Total:</span>
                            <span className="total-value">{stats.baseTotal.toFixed(2)} ml</span>
                            {stats.grandTotal > 0 && (
                              <span className="total-percentage">{((stats.baseTotal / stats.grandTotal) * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total général de la formule - seulement si pas d'erreurs */}
                    {!stats.hasAnyInvalid && (
                      <div className="formula-grand-total">
                        <span className="grand-total-label">Total formule:</span>
                        <span className="grand-total-value">{stats.grandTotal.toFixed(2)} ml</span>
                      </div>
                    )}

                    {/* Avertissement si quantités invalides */}
                    {stats.hasAnyInvalid && (
                      <div className="formula-warning">
                        <span className="warning-icon">⚠️</span>
                        <span className="warning-text">
                          Certaines notes ont une quantité qui ne correspond pas à un nombre valide: {stats.allInvalidNotes.join(', ')}. Corrigez ces valeurs pour voir les totaux et pourcentages.
                        </span>
                      </div>
                    )}

                    {/* Commentaire */}
                    <div className="formula-comment-section">
                      <h5 className="notes-title">Commentaire</h5>
                      <p className="formula-comment">
                        {formula.comment || 'Aucun commentaire'}
                      </p>
                    </div>
                  </>
                )
              })()
            ) : (
              // Mode édition
              <div className="formula-notes-grid editing">
                {/* Notes de tête - édition */}
                <div className="notes-column">
                  <h5 className="notes-title top-notes-title">Notes de tête</h5>
                  <div className="notes-edit-list">
                    {editingData?.top_notes?.map((note, idx) => (
                      <div key={idx} className="note-edit-item">
                        <input
                          type="text"
                          value={note.name}
                          onChange={(e) => handleNoteChange('top_notes', idx, 'name', e.target.value)}
                          placeholder="Nom"
                          className="note-input note-name-input"
                        />
                        <input
                          type="text"
                          value={note.quantity}
                          onChange={(e) => handleNoteChange('top_notes', idx, 'quantity', e.target.value)}
                          placeholder="Qté"
                          className="note-input note-quantity-input"
                        />
                        <button
                          type="button"
                          className="note-remove-btn"
                          onClick={() => handleRemoveNote('top_notes', idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="note-add-btn"
                      onClick={() => handleAddNote('top_notes')}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>

                {/* Notes de cœur - édition */}
                <div className="notes-column">
                  <h5 className="notes-title heart-notes-title">Notes de cœur</h5>
                  <div className="notes-edit-list">
                    {editingData?.heart_notes?.map((note, idx) => (
                      <div key={idx} className="note-edit-item">
                        <input
                          type="text"
                          value={note.name}
                          onChange={(e) => handleNoteChange('heart_notes', idx, 'name', e.target.value)}
                          placeholder="Nom"
                          className="note-input note-name-input"
                        />
                        <input
                          type="text"
                          value={note.quantity}
                          onChange={(e) => handleNoteChange('heart_notes', idx, 'quantity', e.target.value)}
                          placeholder="Qté"
                          className="note-input note-quantity-input"
                        />
                        <button
                          type="button"
                          className="note-remove-btn"
                          onClick={() => handleRemoveNote('heart_notes', idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="note-add-btn"
                      onClick={() => handleAddNote('heart_notes')}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>

                {/* Notes de fond - édition */}
                <div className="notes-column">
                  <h5 className="notes-title base-notes-title">Notes de fond</h5>
                  <div className="notes-edit-list">
                    {editingData?.base_notes?.map((note, idx) => (
                      <div key={idx} className="note-edit-item">
                        <input
                          type="text"
                          value={note.name}
                          onChange={(e) => handleNoteChange('base_notes', idx, 'name', e.target.value)}
                          placeholder="Nom"
                          className="note-input note-name-input"
                        />
                        <input
                          type="text"
                          value={note.quantity}
                          onChange={(e) => handleNoteChange('base_notes', idx, 'quantity', e.target.value)}
                          placeholder="Qté"
                          className="note-input note-quantity-input"
                        />
                        <button
                          type="button"
                          className="note-remove-btn"
                          onClick={() => handleRemoveNote('base_notes', idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="note-add-btn"
                      onClick={() => handleAddNote('base_notes')}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>

                {/* Date - édition */}
                <div className="formula-date-edit">
                  <h5 className="notes-title">Date</h5>
                  <input
                    type="text"
                    value={editingData?.date || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="JJ/MM/AAAA"
                    className="formula-date-input"
                  />
                </div>

                {/* Commentaire - édition */}
                <div className="formula-comment-edit">
                  <h5 className="notes-title">Commentaire</h5>
                  <textarea
                    value={editingData?.comment || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Ajouter un commentaire..."
                    className="formula-comment-input"
                    rows={3}
                  />
                </div>

                {/* Boutons de sauvegarde */}
                <div className="formula-edit-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveFormula}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox pour afficher l'image en grand */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              ✕
            </button>
            <img
              src={`${API_URL}/api/v1/formulas/${lightboxImage.id}/file/thumbnail`}
              alt={lightboxImage.file_name}
              className="lightbox-image"
            />
            <div className="lightbox-info">
              <p>{lightboxImage.file_name}</p>
              <a
                href={`${API_URL}/api/v1/files/${lightboxImage.id}/download`}
                target="_blank"
                download
                className="lightbox-download-btn"
              >
                ⬇️ Télécharger
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour choisir le type d'email */}
      <EmailTypeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        formulaReference={formula?.reference || formula?.id}
      />

      {/* Modal pour les actions */}
      <ActionsModal
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onSelectAction={handleActionSelect}
      />

      {/* Modal pour la commande de produits dérivés */}
      <DerivedProductsOrderModal
        isOpen={showDerivedProductsModal}
        onClose={() => setShowDerivedProductsModal(false)}
        formula={formula}
        customer={customer}
      />
    </div>
  )
}

export default FormulaDetailsPage
