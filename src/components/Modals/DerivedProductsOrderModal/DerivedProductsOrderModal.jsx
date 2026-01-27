import { useState } from 'react'
import './DerivedProductsOrderModal.css'

const API_URL = import.meta.env.VITE_API_URL

const DerivedProductsOrderModal = ({ isOpen, onClose, formula, customer }) => {
  const [formData, setFormData] = useState({
    knownAllergies: '',
    derivedProducts: {},
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const derivedProductOptions = [
    { id: 'gel-douche', label: 'Gel douche' },
    { id: 'creme-corps', label: 'Crème de corps' },
    { id: 'huile-massage', label: 'Huile de massage' },
    { id: 'baume-apres-rasage', label: 'Baume après rasage' }
  ]

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const newProducts = { ...prev.derivedProducts }
      if (newProducts[productId]) {
        delete newProducts[productId]
      } else {
        newProducts[productId] = 1
      }
      return { ...prev, derivedProducts: newProducts }
    })
  }

  const handleQuantityChange = (productId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1)
    setFormData(prev => ({
      ...prev,
      derivedProducts: {
        ...prev.derivedProducts,
        [productId]: qty
      }
    }))
  }

  const handleSubmit = async () => {
    const selectedProducts = Object.keys(formData.derivedProducts)
    if (selectedProducts.length === 0) {
      setError('Veuillez sélectionner au moins un produit dérivé')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const items = selectedProducts.map(productId => {
        const product = derivedProductOptions.find(p => p.id === productId)
        return {
          name: product?.label || productId,
          quantity: formData.derivedProducts[productId]
        }
      })

      const response = await fetch(`${API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customer?.id || formula?.customer_id,
          formula_id: formula?.id,
          comment: formData.comment || '',
          allergy: formData.knownAllergies || '',
          items: items
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création de la commande')
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors de l\'envoi de la commande')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      knownAllergies: '',
      derivedProducts: {},
      comment: ''
    })
    setError('')
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="derived-products-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Commande de produits dérivés</h2>
            <p className="modal-subtitle">Complétez les informations pour la commande</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} disabled={isSubmitting}>×</button>
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
              <p>Commande enregistrée avec succès !</p>
            </div>
          ) : (
            <>
              {/* Informations du client */}
              <div className="client-info-section">
                <h3>Informations du client</h3>
                <div className="client-info-grid">
                  <div className="client-info-item">
                    <span className="info-label">Référence</span>
                    <span className="info-value">{customer?.reference || formula?.reference || 'N/A'}</span>
                  </div>
                  <div className="client-info-item">
                    <span className="info-label">Nom</span>
                    <span className="info-value">{customer?.last_name || 'N/A'}</span>
                  </div>
                  <div className="client-info-item">
                    <span className="info-label">Prénom</span>
                    <span className="info-value">{customer?.first_name || 'N/A'}</span>
                  </div>
                  <div className="client-info-item">
                    <span className="info-label">Nom du parfum</span>
                    <span className="info-value">{formula?.perfume_name || formula?.name || 'N/A'}</span>
                  </div>
                  <div className="client-info-item">
                    <span className="info-label">Date</span>
                    <span className="info-value">{formula?.date || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              {/* Formulaire */}
              <div className="order-form-section">
                <h3>Détails de la commande</h3>

                {/* Allergies */}
                <div className="form-group">
                  <label htmlFor="allergies">Allergie connue</label>
                  <input
                    type="text"
                    id="allergies"
                    value={formData.knownAllergies}
                    onChange={(e) => setFormData(prev => ({ ...prev, knownAllergies: e.target.value }))}
                    placeholder="Renseignez les allergies connues..."
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Produits dérivés */}
                <div className="form-group">
                  <label>Produits dérivés <span className="required">*</span></label>
                  <div className="products-list">
                    {derivedProductOptions.map((product) => {
                      const isSelected = formData.derivedProducts[product.id] !== undefined
                      return (
                        <div key={product.id} className={`product-item ${isSelected ? 'selected' : ''}`}>
                          <label className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleProductToggle(product.id)}
                              disabled={isSubmitting}
                            />
                            <span className="checkbox-checkmark"></span>
                            <span className="checkbox-label">{product.label}</span>
                          </label>
                          {isSelected && (
                            <div className="quantity-control">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuantityChange(product.id, formData.derivedProducts[product.id] - 1)}
                                disabled={isSubmitting || formData.derivedProducts[product.id] <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={formData.derivedProducts[product.id]}
                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                className="qty-input"
                                disabled={isSubmitting}
                              />
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => handleQuantityChange(product.id, formData.derivedProducts[product.id] + 1)}
                                disabled={isSubmitting}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Commentaire */}
                <div className="form-group">
                  <label htmlFor="comment">Commentaire</label>
                  <textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Ajouter un commentaire..."
                    className="form-textarea"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Valider la commande'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DerivedProductsOrderModal
