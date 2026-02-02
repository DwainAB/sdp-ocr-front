import { useState } from 'react'
import './EmailTypeModal.css'

const API_URL = import.meta.env.VITE_API_URL

const EmailTypeModal = ({ isOpen, onClose, formulaReference }) => {
  const [selectedEmailType, setSelectedEmailType] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const emailTypes = [
    {
      id: 'pyramid',
      label: 'Récapitulatif de la formule',
      description: 'Envoie un récapitulatif complet de la formule au client',
      endpoint: '/api/v1/emails/pyramid',
      previewEndpoint: '/api/v1/emails/pyramid/preview'
    }
    // Ajouter d'autres types d'email ici par la suite
  ]

  const handleEmailTypeSelect = async (emailType) => {
    setSelectedEmailType(emailType)
    setShowPreview(true)
    setIsLoadingPreview(true)
    setError('')
    setPreviewData(null)

    try {
      const response = await fetch(`${API_URL}${emailType.previewEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: formulaReference })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors du chargement de l\'aperçu')
      }

      const data = await response.json()
      setPreviewData(data)
    } catch (error) {
      console.error('Erreur preview:', error)
      setError(error.message)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleBackToSelection = () => {
    setShowPreview(false)
    setSelectedEmailType(null)
    setPreviewData(null)
    setError('')
  }

  const handleSendEmail = async () => {
    if (!selectedEmailType || !formulaReference) return

    setIsSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}${selectedEmailType.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: formulaReference
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de l\'envoi de l\'email')
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setSelectedEmailType(null)
    setShowPreview(false)
    setPreviewData(null)
    setIsLoadingPreview(false)
    setError('')
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`email-type-modal-content${showPreview ? ' email-type-modal-content--preview' : ''}`} onClick={(e) => e.stopPropagation()}>
        {!showPreview ? (
          // Écran de sélection du type d'email
          <>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Envoyer un email</h2>
                <p className="modal-subtitle">Sélectionnez le type d'email à envoyer</p>
              </div>
              <button className="modal-close-btn" onClick={handleClose}>×</button>
            </div>

            <div className="modal-body">
              <div className="email-types-list">
                {emailTypes.map((emailType) => (
                  <button
                    key={emailType.id}
                    className="email-type-btn"
                    onClick={() => handleEmailTypeSelect(emailType)}
                  >
                    <span className="email-type-icon">📧</span>
                    <div className="email-type-info">
                      <span className="email-type-label">{emailType.label}</span>
                      <span className="email-type-description">{emailType.description}</span>
                    </div>
                    <span className="email-type-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Écran de prévisualisation
          <>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Aperçu de l'email</h2>
                <p className="modal-subtitle">{selectedEmailType?.label}</p>
              </div>
              <button className="modal-close-btn" onClick={handleClose} disabled={isSending}>×</button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="form-error">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {success ? (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  <p>Email envoyé avec succès !</p>
                </div>
              ) : isLoadingPreview ? (
                <div className="email-preview-loading">
                  <span className="spinner"></span>
                  <p>Chargement de l'aperçu...</p>
                </div>
              ) : previewData ? (
                <>
                  <div className="email-preview-meta">
                    <div className="email-preview-meta-row">
                      <span className="email-preview-meta-label">Destinataire :</span>
                      <span className="email-preview-meta-value">{previewData.to}</span>
                    </div>
                    <div className="email-preview-meta-row">
                      <span className="email-preview-meta-label">Sujet :</span>
                      <span className="email-preview-meta-value">{previewData.subject}</span>
                    </div>
                  </div>

                  <div className="email-preview-section">
                    <iframe
                      srcDoc={previewData.html}
                      sandbox=""
                      title="Aperçu de l'email"
                      className="email-preview-iframe"
                    />
                  </div>

                  <div className="confirmation-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleBackToSelection}
                      disabled={isSending}
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendEmail}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>
                          <span className="spinner"></span>
                          Envoi en cours...
                        </>
                      ) : (
                        'Envoyer'
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EmailTypeModal
