import './ActionsModal.css'

const ActionsModal = ({ isOpen, onClose, onSelectAction }) => {
  const actions = [
    {
      id: 'derived-products',
      label: 'Commande de produits dérivés',
      description: 'Commander des produits dérivés pour ce parfum',
      icon: '🧴'
    }
    // Ajouter d'autres options ici par la suite
  ]

  const handleActionSelect = (action) => {
    onSelectAction(action.id)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="actions-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Actions</h2>
            <p className="modal-subtitle">Sélectionnez une action à effectuer</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="actions-list">
            {actions.map((action) => (
              <button
                key={action.id}
                className="action-option-btn"
                onClick={() => handleActionSelect(action)}
              >
                <span className="action-option-icon">{action.icon}</span>
                <div className="action-option-info">
                  <span className="action-option-label">{action.label}</span>
                  <span className="action-option-description">{action.description}</span>
                </div>
                <span className="action-option-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActionsModal
