import { useState, useEffect } from 'react'
import './FormulaDetailModal.css'

const API_URL = import.meta.env.VITE_API_URL

const FormulaDetailModal = ({ isOpen, onClose, formula, onFormulaUpdated }) => {
  const [selectedFormula, setSelectedFormula] = useState(null)
  const [formulaLoading, setFormulaLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [isEditingFormula, setIsEditingFormula] = useState(false)
  const [editingFormulaData, setEditingFormulaData] = useState(null)
  const [formulaSaving, setFormulaSaving] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    if (formula && isOpen) {
      fetchFormulaDetails(formula.id)
    }
  }, [formula, isOpen])

  const fetchFormulaDetails = async (formulaId) => {
    if (!formulaId) return

    setFormulaLoading(true)
    setModalError('')

    try {
      const response = await fetch(`${API_URL}/api/v1/formulas/${formulaId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la formule')
      }

      const formulaDetails = await response.json()
      setSelectedFormula(formulaDetails)
    } catch (error) {
      console.error('Erreur lors du chargement de la formule:', error)
      setModalError(error.message)
    } finally {
      setFormulaLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFormula(null)
    setIsEditingFormula(false)
    setEditingFormulaData(null)
    setLightboxImage(null)
    setModalError('')
    onClose()
  }

  const handleEditFormula = () => {
    setEditingFormulaData(JSON.parse(JSON.stringify(selectedFormula)))
    setIsEditingFormula(true)
  }

  const handleCancelEditFormula = () => {
    setIsEditingFormula(false)
    setEditingFormulaData(null)
  }

  const handleFormulaNoteCh = (noteType, index, field, value) => {
    setEditingFormulaData(prev => {
      const updated = { ...prev }
      updated[noteType] = [...prev[noteType]]
      updated[noteType][index] = { ...updated[noteType][index], [field]: value }
      return updated
    })
  }

  const handleAddFormulaNote = (noteType) => {
    setEditingFormulaData(prev => {
      const updated = { ...prev }
      updated[noteType] = [...(prev[noteType] || []), { name: '', quantity: '' }]
      return updated
    })
  }

  const handleRemoveFormulaNote = (noteType, index) => {
    setEditingFormulaData(prev => {
      const updated = { ...prev }
      updated[noteType] = prev[noteType].filter((_, i) => i !== index)
      return updated
    })
  }

  const handleSaveFormula = async () => {
    if (!editingFormulaData?.id) return

    setFormulaSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/formulas/${editingFormulaData.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          top_notes: editingFormulaData.top_notes || [],
          heart_notes: editingFormulaData.heart_notes || [],
          base_notes: editingFormulaData.base_notes || [],
          comment: editingFormulaData.comment || ''
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la formule')
      }

      const updatedFormula = await response.json()
      setSelectedFormula(updatedFormula)
      setIsEditingFormula(false)
      setEditingFormulaData(null)

      if (onFormulaUpdated) {
        onFormulaUpdated(updatedFormula)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setModalError(error.message)
    } finally {
      setFormulaSaving(false)
    }
  }

  const openLightbox = (file) => {
    setLightboxImage(file)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="formula-detail-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <h2>{formulaLoading ? 'Chargement...' : `Formule ${selectedFormula?.id || ''}`}</h2>
            </div>
            <div className="header-actions">
              {!isEditingFormula && !formulaLoading && selectedFormula && (
                <>
                  <button
                    className="edit-btn"
                    onClick={handleEditFormula}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="email-btn"
                    onClick={() => window.location.href = `mailto:?subject=Formule ${selectedFormula.id}&body=Détails de la formule ${selectedFormula.id}`}
                  >
                    ✉️ Envoyer par mail
                  </button>
                </>
              )}
              <button className="modal-close-btn" onClick={handleClose}>×</button>
            </div>
          </div>

          <div className="modal-body">
            {modalError && (
              <div className="form-error">
                <span>⚠️ {modalError}</span>
              </div>
            )}

            {formulaLoading ? (
              <div className="formula-loading">
                <span className="spinner"></span>
                <p>Chargement de la formule...</p>
              </div>
            ) : selectedFormula && (
              <div className="formula-detail-layout">
                {/* Section Fichier associé */}
                <div className="formula-file-section">
                  <h4>Document associé</h4>
                  {selectedFormula.id ? (
                    <div className="formula-file-preview">
                      <img
                        src={`${API_URL}/api/v1/formulas/${selectedFormula.id}/file/thumbnail`}
                        alt={`Fichier de la formule ${selectedFormula.id}`}
                        className="formula-preview-image"
                        onClick={() => {
                          openLightbox({
                            id: selectedFormula.id,
                            file_name: `Formule ${selectedFormula.id}`,
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

                  {!isEditingFormula ? (
                    // Mode lecture
                    <>
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

                      {/* Commentaire */}
                      <div className="formula-comment-section">
                        <h5 className="notes-title">Commentaire</h5>
                        <p className="formula-comment">
                          {selectedFormula.comment || 'Aucun commentaire'}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Mode édition
                    <div className="formula-notes-grid editing">
                      {/* Notes de tête - édition */}
                      <div className="notes-column">
                        <h5 className="notes-title">Notes de tête</h5>
                        <div className="notes-edit-list">
                          {editingFormulaData?.top_notes?.map((note, idx) => (
                            <div key={idx} className="note-edit-item">
                              <input
                                type="text"
                                value={note.name}
                                onChange={(e) => handleFormulaNoteCh('top_notes', idx, 'name', e.target.value)}
                                placeholder="Nom"
                                className="note-input note-name-input"
                              />
                              <input
                                type="text"
                                value={note.quantity}
                                onChange={(e) => handleFormulaNoteCh('top_notes', idx, 'quantity', e.target.value)}
                                placeholder="Qté"
                                className="note-input note-quantity-input"
                              />
                              <button
                                type="button"
                                className="note-remove-btn"
                                onClick={() => handleRemoveFormulaNote('top_notes', idx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="note-add-btn"
                            onClick={() => handleAddFormulaNote('top_notes')}
                          >
                            + Ajouter
                          </button>
                        </div>
                      </div>

                      {/* Notes de cœur - édition */}
                      <div className="notes-column">
                        <h5 className="notes-title">Notes de cœur</h5>
                        <div className="notes-edit-list">
                          {editingFormulaData?.heart_notes?.map((note, idx) => (
                            <div key={idx} className="note-edit-item">
                              <input
                                type="text"
                                value={note.name}
                                onChange={(e) => handleFormulaNoteCh('heart_notes', idx, 'name', e.target.value)}
                                placeholder="Nom"
                                className="note-input note-name-input"
                              />
                              <input
                                type="text"
                                value={note.quantity}
                                onChange={(e) => handleFormulaNoteCh('heart_notes', idx, 'quantity', e.target.value)}
                                placeholder="Qté"
                                className="note-input note-quantity-input"
                              />
                              <button
                                type="button"
                                className="note-remove-btn"
                                onClick={() => handleRemoveFormulaNote('heart_notes', idx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="note-add-btn"
                            onClick={() => handleAddFormulaNote('heart_notes')}
                          >
                            + Ajouter
                          </button>
                        </div>
                      </div>

                      {/* Notes de fond - édition */}
                      <div className="notes-column">
                        <h5 className="notes-title">Notes de fond</h5>
                        <div className="notes-edit-list">
                          {editingFormulaData?.base_notes?.map((note, idx) => (
                            <div key={idx} className="note-edit-item">
                              <input
                                type="text"
                                value={note.name}
                                onChange={(e) => handleFormulaNoteCh('base_notes', idx, 'name', e.target.value)}
                                placeholder="Nom"
                                className="note-input note-name-input"
                              />
                              <input
                                type="text"
                                value={note.quantity}
                                onChange={(e) => handleFormulaNoteCh('base_notes', idx, 'quantity', e.target.value)}
                                placeholder="Qté"
                                className="note-input note-quantity-input"
                              />
                              <button
                                type="button"
                                className="note-remove-btn"
                                onClick={() => handleRemoveFormulaNote('base_notes', idx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="note-add-btn"
                            onClick={() => handleAddFormulaNote('base_notes')}
                          >
                            + Ajouter
                          </button>
                        </div>
                      </div>

                      {/* Commentaire - édition */}
                      <div className="formula-comment-edit">
                        <h5 className="notes-title">Commentaire</h5>
                        <textarea
                          value={editingFormulaData?.comment || ''}
                          onChange={(e) => setEditingFormulaData(prev => ({ ...prev, comment: e.target.value }))}
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
                          onClick={handleCancelEditFormula}
                          disabled={formulaSaving}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleSaveFormula}
                          disabled={formulaSaving}
                        >
                          {formulaSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
    </>
  )
}

export default FormulaDetailModal
