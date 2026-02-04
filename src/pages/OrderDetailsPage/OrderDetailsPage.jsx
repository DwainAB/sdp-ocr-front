import { useState, useEffect } from 'react'
import { ordersApi, usersApi } from '../../services/api'
import './OrderDetailsPage.css'

const derivedProductOptions = [
  { id: 'gel-douche', label: 'Gel douche' },
  { id: 'creme-corps', label: 'Crème de corps' },
  { id: 'huile-massage', label: 'Huile de massage' },
  { id: 'baume-apres-rasage', label: 'Baume après rasage' },
]

const OrderDetailsPage = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [editItems, setEditItems] = useState([])
  const [editComment, setEditComment] = useState('')
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [isEditingAllergy, setIsEditingAllergy] = useState(false)
  const [editAllergy, setEditAllergy] = useState('')
  const [isSavingAllergy, setIsSavingAllergy] = useState(false)
  const [isSavingItems, setIsSavingItems] = useState(false)
  const [users, setUsers] = useState([])
  const [isEditingOrderInfo, setIsEditingOrderInfo] = useState(false)
  const [editType, setEditType] = useState('')
  const [editResponsible, setEditResponsible] = useState('')
  const [editDesiredDate, setEditDesiredDate] = useState('')
  const [isSavingOrderInfo, setIsSavingOrderInfo] = useState(false)

  const typeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'express', label: 'Express' },
    { value: 'sur-mesure', label: 'Sur mesure' }
  ]

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersApi.getAll()
        setUsers(data.users || data || [])
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err)
      }
    }
    fetchUsers()
  }, [])

  const getResponsibleName = (responsibleId) => {
    if (!responsibleId) return 'Non assigné'
    const user = users.find(u => u.id === responsibleId)
    return user ? `${user.first_name} ${user.last_name}` : `Utilisateur #${responsibleId}`
  }

  const usersByTeam = users.reduce((acc, user) => {
    const team = user.team || 'Autre'
    if (!acc[team]) acc[team] = []
    acc[team].push(user)
    return acc
  }, {})

  const sortedTeams = Object.keys(usersByTeam).sort()

  // --- Edit type + responsible ---
  const startEditingOrderInfo = () => {
    setEditType(order?.type || '')
    setEditResponsible(order?.responsible ? String(order.responsible) : '')
    setEditDesiredDate(order?.desired_date || '')
    setIsEditingOrderInfo(true)
  }

  const cancelEditingOrderInfo = () => {
    setIsEditingOrderInfo(false)
    setEditType('')
    setEditResponsible('')
    setEditDesiredDate('')
    setError('')
  }

  const saveOrderInfo = async () => {
    setIsSavingOrderInfo(true)
    setError('')
    try {
      await ordersApi.update(orderId, {
        type: editType || null,
        responsible: editResponsible ? parseInt(editResponsible) : null,
        desired_date: editDesiredDate || null
      })
      await fetchOrderDetails(orderId)
      setIsEditingOrderInfo(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setIsSavingOrderInfo(false)
    }
  }

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

  // --- Edit comment ---
  const startEditingComment = () => {
    setEditComment(order?.comment || '')
    setIsEditingComment(true)
  }

  const cancelEditingComment = () => {
    setIsEditingComment(false)
    setEditComment('')
    setError('')
  }

  const saveComment = async () => {
    setIsSavingComment(true)
    setError('')
    try {
      await ordersApi.update(orderId, { comment: editComment })
      await fetchOrderDetails(orderId)
      setIsEditingComment(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de la sauvegarde du commentaire')
    } finally {
      setIsSavingComment(false)
    }
  }

  // --- Edit allergy ---
  const startEditingAllergy = () => {
    setEditAllergy(order?.allergy || '')
    setIsEditingAllergy(true)
  }

  const cancelEditingAllergy = () => {
    setIsEditingAllergy(false)
    setEditAllergy('')
    setError('')
  }

  const saveAllergy = async () => {
    setIsSavingAllergy(true)
    setError('')
    try {
      await ordersApi.update(orderId, { allergy: editAllergy })
      await fetchOrderDetails(orderId)
      setIsEditingAllergy(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de la sauvegarde des allergies')
    } finally {
      setIsSavingAllergy(false)
    }
  }

  // --- Edit items ---
  const startEditingItems = () => {
    setEditItems(
      (order?.items || []).map((item, index) => ({
        id: item.id || index,
        name: item.name || item.product_name || `Article ${index + 1}`,
        quantity: item.quantity || 1,
        isNew: false,
      }))
    )
    setIsEditingItems(true)
  }

  const cancelEditingItems = () => {
    setIsEditingItems(false)
    setEditItems([])
    setError('')
  }

  const handleEditQuantityChange = (index, delta) => {
    setEditItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    )
  }

  const handleEditQuantityInput = (index, value) => {
    const qty = Math.max(1, parseInt(value) || 1)
    setEditItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    )
  }

  const handleRemoveItem = (index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddProduct = (productLabel) => {
    const alreadyExists = editItems.some(item => item.name === productLabel)
    if (alreadyExists) return
    setEditItems(prev => [...prev, { id: `new-${Date.now()}`, name: productLabel, quantity: 1, isNew: true }])
  }

  const saveItems = async () => {
    if (editItems.length === 0) {
      setError('La commande doit contenir au moins un article')
      return
    }

    setIsSavingItems(true)
    setError('')
    try {
      const originalItems = order?.items || []
      const originalIds = originalItems.map(item => item.id)
      const editedIds = editItems.filter(item => !item.isNew).map(item => item.id)

      // Supprimer les articles retirés
      const removedIds = originalIds.filter(id => !editedIds.includes(id))
      for (const itemId of removedIds) {
        await ordersApi.deleteItem(orderId, itemId)
      }

      // Mettre à jour les quantités modifiées
      for (const editItem of editItems) {
        if (editItem.isNew) continue
        const original = originalItems.find(item => item.id === editItem.id)
        if (original && original.quantity !== editItem.quantity) {
          await ordersApi.updateItem(orderId, editItem.id, { quantity: editItem.quantity })
        }
      }

      // Ajouter les nouveaux articles
      for (const editItem of editItems) {
        if (!editItem.isNew) continue
        await ordersApi.addItem(orderId, { name: editItem.name, quantity: editItem.quantity })
      }

      await fetchOrderDetails(orderId)
      setIsEditingItems(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de la sauvegarde des articles')
    } finally {
      setIsSavingItems(false)
    }
  }

  const availableProductsToAdd = derivedProductOptions.filter(
    p => !editItems.some(item => item.name === p.label)
  )

  const canEdit = order?.status === 'PENDING' || order?.status === 'IN_PROGRESS'

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
            <div className="section-header-inline">
              <h3>Informations commande</h3>
              {canEdit && !isEditingOrderInfo && (
                <button className="inline-edit-btn" onClick={startEditingOrderInfo}>
                  ✎ Modifier
                </button>
              )}
              {isEditingOrderInfo && (
                <div className="inline-edit-actions">
                  <button
                    className="inline-save-btn"
                    onClick={saveOrderInfo}
                    disabled={isSavingOrderInfo}
                  >
                    {isSavingOrderInfo ? '...' : '✓ Valider'}
                  </button>
                  <button
                    className="inline-cancel-btn"
                    onClick={cancelEditingOrderInfo}
                    disabled={isSavingOrderInfo}
                  >
                    ✕ Annuler
                  </button>
                </div>
              )}
            </div>
            <div className="info-grid">
              <div className="info-item">
                <label>Référence</label>
                <span>{order?.reference || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <label>Date de création</label>
                <span>{formatDate(order?.date)}</span>
              </div>
              <div className="info-item">
                <label>Date souhaitée</label>
                {isEditingOrderInfo ? (
                  <input
                    type="date"
                    className="edit-input"
                    value={editDesiredDate}
                    onChange={(e) => setEditDesiredDate(e.target.value)}
                  />
                ) : (
                  <span>{order?.desired_date ? new Date(order.desired_date).toLocaleDateString('fr-FR') : 'Non renseigné'}</span>
                )}
              </div>
              <div className="info-item">
                <label>Type</label>
                {isEditingOrderInfo ? (
                  <select
                    className="edit-select"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="">-- Aucun type --</option>
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span>{order?.type || 'Non renseigné'}</span>
                )}
              </div>
              <div className="info-item">
                <label>Responsable</label>
                {isEditingOrderInfo ? (
                  <select
                    className="edit-select"
                    value={editResponsible}
                    onChange={(e) => setEditResponsible(e.target.value)}
                  >
                    <option value="">-- Non assigné --</option>
                    {sortedTeams.map(team => (
                      <optgroup key={team} label={team}>
                        {usersByTeam[team].map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <span>{getResponsibleName(order?.responsible)}</span>
                )}
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
            <div className="section-header-inline">
              <h3>Commentaire</h3>
              {canEdit && !isEditingComment && (
                <button className="inline-edit-btn" onClick={startEditingComment}>
                  ✎ Modifier
                </button>
              )}
              {isEditingComment && (
                <div className="inline-edit-actions">
                  <button
                    className="inline-save-btn"
                    onClick={saveComment}
                    disabled={isSavingComment}
                  >
                    {isSavingComment ? '...' : '✓ Valider'}
                  </button>
                  <button
                    className="inline-cancel-btn"
                    onClick={cancelEditingComment}
                    disabled={isSavingComment}
                  >
                    ✕ Annuler
                  </button>
                </div>
              )}
            </div>
            {isEditingComment ? (
              <textarea
                className="edit-textarea"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={4}
              />
            ) : (
              <div className="text-content">
                {order?.comment || 'Aucun commentaire'}
              </div>
            )}
          </div>

          <div className="info-section allergy-section">
            <div className="section-header-inline">
              <h3>Allergies</h3>
              {canEdit && !isEditingAllergy && (
                <button className="inline-edit-btn" onClick={startEditingAllergy}>
                  ✎ Modifier
                </button>
              )}
              {isEditingAllergy && (
                <div className="inline-edit-actions">
                  <button
                    className="inline-save-btn"
                    onClick={saveAllergy}
                    disabled={isSavingAllergy}
                  >
                    {isSavingAllergy ? '...' : '✓ Valider'}
                  </button>
                  <button
                    className="inline-cancel-btn"
                    onClick={cancelEditingAllergy}
                    disabled={isSavingAllergy}
                  >
                    ✕ Annuler
                  </button>
                </div>
              )}
            </div>
            {isEditingAllergy ? (
              <textarea
                className="edit-textarea"
                value={editAllergy}
                onChange={(e) => setEditAllergy(e.target.value)}
                placeholder="Renseigner les allergies..."
                rows={4}
              />
            ) : (
              <div className="text-content">
                {order?.allergy || 'Aucune allergie signalée'}
              </div>
            )}
          </div>
        </div>

        {/* Articles de la commande */}
        <div className="info-section items-section">
          <div className="section-header-inline">
            <h3>Articles de la commande ({isEditingItems ? editItems.length : (order?.items?.length || 0)})</h3>
            {canEdit && !isEditingItems && (
              <button className="inline-edit-btn" onClick={startEditingItems}>
                ✎ Modifier
              </button>
            )}
            {isEditingItems && (
              <div className="inline-edit-actions">
                <button
                  className="inline-save-btn"
                  onClick={saveItems}
                  disabled={isSavingItems}
                >
                  {isSavingItems ? '...' : '✓ Valider'}
                </button>
                <button
                  className="inline-cancel-btn"
                  onClick={cancelEditingItems}
                  disabled={isSavingItems}
                >
                  ✕ Annuler
                </button>
              </div>
            )}
          </div>
          {isEditingItems ? (
            <>
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Quantité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>
                          <div className="edit-quantity-control">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleEditQuantityChange(index, -1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleEditQuantityInput(index, e.target.value)}
                              className="qty-input"
                            />
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleEditQuantityChange(index, 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className="remove-item-btn"
                            onClick={() => handleRemoveItem(index)}
                            title="Supprimer cet article"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {availableProductsToAdd.length > 0 && (
                <div className="add-product-section">
                  <span className="add-product-label">Ajouter un produit :</span>
                  <div className="add-product-buttons">
                    {availableProductsToAdd.map(product => (
                      <button
                        key={product.id}
                        className="add-product-btn"
                        onClick={() => handleAddProduct(product.label)}
                      >
                        + {product.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            order?.items && order.items.length > 0 && (
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
            )
          )}
        </div>
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
