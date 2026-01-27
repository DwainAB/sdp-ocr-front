import { useState } from 'react'
import './EmailTypeModal.css'

const API_URL = import.meta.env.VITE_API_URL

const EmailTypeModal = ({ isOpen, onClose, formulaReference }) => {
  const [selectedEmailType, setSelectedEmailType] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const emailTypes = [
    {
      id: 'pyramid',
      label: 'Récapitulatif de la formule',
      description: 'Envoie un récapitulatif complet de la formule au client',
      endpoint: '/api/v1/emails/pyramid'
    }
    // Ajouter d'autres types d'email ici par la suite
  ]

  const handleEmailTypeSelect = (emailType) => {
    setSelectedEmailType(emailType)
    setShowConfirmation(true)
    setError('')
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setSelectedEmailType(null)
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
    setShowConfirmation(false)
    setError('')
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="email-type-modal-content" onClick={(e) => e.stopPropagation()}>
        {!showConfirmation ? (
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
          // Écran de confirmation
          <>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Confirmer l'envoi</h2>
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
              ) : (
                <>
                  <div className="confirmation-content">
                    <div className="confirmation-icon">📨</div>
                    <p className="confirmation-text">
                      Vous êtes sur le point d'envoyer un email de type :
                    </p>
                    <p className="confirmation-email-type">
                      {selectedEmailType?.label}
                    </p>
                    <p className="confirmation-reference">
                      Référence : <strong>{formulaReference}</strong>
                    </p>
                  </div>

                  <div className="confirmation-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCancelConfirmation}
                      disabled={isSending}
                    >
                      Annuler
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EmailTypeModal
