import { useState, useEffect } from 'react'
import { ordersApi } from '../../services/api'
import './OrderDetailsPage.css'

const OrderDetailsPage = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  const statusOptions = [
    { value: 'PENDING', label: 'En attente', color: '#eab308' },
    { value: 'CONFIRMED', label: 'Confirmée', color: '#3b82f6' },
    { value: 'IN_PROGRESS', label: 'En cours', color: '#8b5cf6' },
    { value: 'COMPLETED', label: 'Terminée', color: '#10b981' },
    { value: 'CANCELLED', label: 'Annulée', color: '#ef4444' },
  ]

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId)
    }
  }, [orderId])

  const fetchOrderDetails = async (id) => {
    setIsLoading(true)
    setError('')
    try {
      const data = await ordersApi.getById(id)
      setOrder(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des détails de la commande')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: '#6b7280' }
  }

  const getStatusActionInfo = (newStatus) => {
    const statusActions = {
      IN_PROGRESS: { label: 'Préparer cette commande', message: 'Voulez-vous préparer cette commande ?' },
      COMPLETED: { label: 'Marquer comme prête', message: 'Voulez-vous marquer cette commande comme prête ?' },
      CANCELLED: { label: 'Annuler la commande', message: 'Voulez-vous vraiment annuler cette commande ?' },
    }
    return statusActions[newStatus] || { label: newStatus, message: `Voulez-vous changer le statut en ${newStatus} ?` }
  }

  const openConfirmModal = (newStatus) => {
    setPendingStatus(newStatus)
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false)
    setPendingStatus(null)
  }

  const confirmStatusUpdate = async () => {
    if (!pendingStatus) return

    setIsUpdating(true)
    setError('')
    try {
      await ordersApi.update(orderId, { status: pendingStatus })
      await fetchOrderDetails(orderId)
      closeConfirmModal()
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de la mise à jour du statut')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="section-content">
        <div className="loading-section">
          <span className="loading-spinner">
            <span className="spinner"></span>
            Chargement des détails de la commande...
          </span>
        </div>
      </div>
    )
  }

  if (error && !order) {
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

  const statusInfo = getStatusInfo(order?.status)

  return (
    <div className="section-content order-details-page">
      <div className="section-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ←
          </button>
          <div className="header-title">
            <h2>Détails de la commande #{order?.id}</h2>
            <p>
              {order?.customer?.first_name} {order?.customer?.last_name}
              <span
                className="status-badge-header"
                style={{ backgroundColor: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
            </p>
          </div>
        </div>
        <div className="header-actions">
          {order?.status === 'PENDING' && (
            <button
              className="action-btn status-btn in-progress-btn"
              onClick={() => openConfirmModal('IN_PROGRESS')}
              disabled={isUpdating}
            >
              <span className="btn-icon">▶</span>
              Préparer cette commande
            </button>
          )}
          {order?.status === 'IN_PROGRESS' && (
            <button
              className="action-btn status-btn ready-btn"
              onClick={() => openConfirmModal('COMPLETED')}
              disabled={isUpdating}
            >
              <span className="btn-icon">✓</span>
              Marquer comme prête
            </button>
          )}
          {(order?.status === 'PENDING' || order?.status === 'IN_PROGRESS') && (
            <button
              className="action-btn status-btn cancel-btn"
              onClick={() => openConfirmModal('CANCELLED')}
              disabled={isUpdating}
            >
              <span className="btn-icon">✕</span>
              Annuler
            </button>
          )}
          <button className="action-btn refresh-btn" onClick={() => fetchOrderDetails(orderId)}>
            <span className="btn-icon">↻</span>
            <span className="btn-tooltip">Actualiser</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error">
          <span>{error}</span>
        </div>
      )}

      <div className="order-info-content">
        <div className="info-sections-container">
          {/* Informations client */}
          <div className="info-section">
            <h3>Informations client</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nom</label>
                <span>{order?.customer?.last_name || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Prénom</label>
                <span>{order?.customer?.first_name || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{order?.customer?.email || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Téléphone</label>
                <span>{order?.customer?.phone || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Ville</label>
                <span>{order?.customer?.city || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Pays</label>
                <span>{order?.customer?.country || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          {/* Informations commande */}
          <div className="info-section">
            <h3>Informations commande</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Référence</label>
                <span>#{order?.id}</span>
              </div>
              <div className="info-item">
                <label>Date de création</label>
                <span>{formatDate(order?.date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formule associée */}
        {order?.formula && (
          <div className="info-section formula-section">
            <h3>Formule associée</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Référence formule</label>
                <span>{order.formula.reference || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Nom du parfum</label>
                <span>{order.formula.perfume_name || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="notes-container">
              {order.formula.top_notes && order.formula.top_notes.length > 0 && (
                <div className="notes-section">
                  <h4>Notes de tête</h4>
                  <div className="notes-list">
                    {order.formula.top_notes.map((note) => (
                      <span key={note.id} className="note-tag top-note">
                        {note.name} ({note.quantity} ml) 
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {order.formula.heart_notes && order.formula.heart_notes.length > 0 && (
                <div className="notes-section">
                  <h4>Notes de coeur</h4>
                  <div className="notes-list">
                    {order.formula.heart_notes.map((note) => (
                      <span key={note.id} className="note-tag heart-note">
                        {note.name} ({note.quantity} ml)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {order.formula.base_notes && order.formula.base_notes.length > 0 && (
                <div className="notes-section">
                  <h4>Notes de fond</h4>
                  <div className="notes-list">
                    {order.formula.base_notes.map((note) => (
                      <span key={note.id} className="note-tag base-note">
                        {note.name} ({note.quantity} ml)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commentaire et allergie */}
        <div className="info-sections-row">
          <div className="info-section comment-section">
            <h3>Commentaire</h3>
            <div className="text-content">
              {order?.comment || 'Aucun commentaire'}
            </div>
          </div>

          <div className="info-section allergy-section">
            <h3>Allergies</h3>
            <div className="text-content">
              {order?.allergy || 'Aucune allergie signalée'}
            </div>
          </div>
        </div>

        {/* Articles de la commande */}
        {order?.items && order.items.length > 0 && (
          <div className="info-section items-section">
            <h3>Articles de la commande ({order.items.length})</h3>
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Quantité</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name || item.product_name || `Article ${index + 1}`}</td>
                      <td>{item.quantity || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && pendingStatus && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getStatusActionInfo(pendingStatus).label}</h3>
              <button className="modal-close-btn" onClick={closeConfirmModal}>✕</button>
            </div>
            <div className="modal-body">
              <p>{getStatusActionInfo(pendingStatus).message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeConfirmModal}
                disabled={isUpdating}
              >
                Annuler
              </button>
              <button
                className={`btn btn-primary ${pendingStatus === 'CANCELLED' ? 'btn-danger' : ''}`}
                onClick={confirmStatusUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetailsPage
