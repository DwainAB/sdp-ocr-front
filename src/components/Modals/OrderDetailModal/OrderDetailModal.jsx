import './OrderDetailModal.css'

const statusOptions = [
  { value: 'PENDING', label: 'En attente', color: '#eab308' },
  { value: 'CONFIRMED', label: 'Confirmée', color: '#3b82f6' },
  { value: 'IN_PROGRESS', label: 'En cours', color: '#8b5cf6' },
  { value: 'COMPLETED', label: 'Terminée', color: '#10b981' },
  { value: 'CANCELLED', label: 'Annulée', color: '#ef4444' },
]

const getStatusInfo = (status) => {
  return statusOptions.find(s => s.value === status) || { label: status, color: '#6b7280' }
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

const OrderDetailModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Commande #{order.id}</h2>
            <span
              className="order-modal-status-badge"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="order-modal-info-grid">
            <div className="order-modal-info-item">
              <label>Date</label>
              <span>{formatDate(order.date)}</span>
            </div>
            <div className="order-modal-info-item">
              <label>Allergies</label>
              <span>{order.allergy || 'Aucune'}</span>
            </div>
            <div className="order-modal-info-item full-width">
              <label>Commentaire</label>
              <span>{order.comment || 'Aucun commentaire'}</span>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-modal-items">
              <h4>Produits commandés</h4>
              <div className="order-modal-table-container">
                <table className="order-modal-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
