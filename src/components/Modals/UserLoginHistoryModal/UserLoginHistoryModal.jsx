import { useState, useEffect } from 'react'
import { usersApi } from '../../../services/api'
import './UserLoginHistoryModal.css'

const UserLoginHistoryModal = ({ isOpen, onClose, user }) => {
  const [loginHistory, setLoginHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total_items: 0,
    total_pages: 0,
    current_page: 1,
    page_size: 10
  })
  const [availablePeriods, setAvailablePeriods] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  const getUserHistory = async (userId, page = 1, year = '', month = '') => {
    try {
      console.log(`Fetching logs for user ID: ${userId}, page: ${page}, year: ${year}, month: ${month}`)
      const data = await usersApi.getLoginHistory(userId, page, 10, year || null, month || null)
      console.log('API Response:', data)
      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  const getAvailablePeriods = async (userId) => {
    try {
      console.log(`Fetching available periods for user ID: ${userId}`)
      const data = await usersApi.getLoginHistoryPeriods(userId)
      console.log('Available periods:', data)
      return data.periods || []
    } catch (error) {
      console.error('Periods API Error:', error)
      return []
    }
  }

  useEffect(() => {
    if (isOpen && user?.id) {
      initializeModal()
    }
  }, [isOpen, user])

  const initializeModal = async () => {
    try {
      // 1. Récupérer les périodes disponibles
      const periods = await getAvailablePeriods(user.id)
      setAvailablePeriods(periods)

      // 2. Définir la période par défaut (la plus récente)
      if (periods.length > 0) {
        const latestPeriod = periods[0] // Supposons que l'API retourne les périodes triées par date décroissante
        setSelectedYear(latestPeriod.year.toString())
        setSelectedMonth(latestPeriod.month.toString())

        // 3. Charger les logs pour cette période
        loadLoginHistory(1, latestPeriod.year.toString(), latestPeriod.month.toString())
      } else {
        // Aucune période disponible, charger tous les logs
        loadLoginHistory(1)
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error)
      loadLoginHistory(1) // Fallback
    }
  }

  const loadLoginHistory = async (page, year = selectedYear, month = selectedMonth) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getUserHistory(user.id, page, year, month)
      console.log('Processing data:', data)
      setLoginHistory(data.records || [])
      setPagination({
        total_items: data.total || 0,
        total_pages: data.total_pages || Math.ceil((data.total || 0) / 10),
        current_page: data.page || page,
        page_size: data.size || 10
      })
      setCurrentPage(data.page || page)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors du chargement de l\'historique')
      setLoginHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)
    } catch {
      return dateString
    }
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.total_pages) {
      loadLoginHistory(page, selectedYear, selectedMonth)
    }
  }

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear)

    // Réinitialiser le mois au premier mois disponible pour cette année
    const monthsForYear = getAvailableMonthsForYear(newYear)
    const defaultMonth = monthsForYear.length > 0 ? monthsForYear[0].value : ''
    setSelectedMonth(defaultMonth)

    // Recharger les logs
    loadLoginHistory(1, newYear, defaultMonth)
  }

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth)
    loadLoginHistory(1, selectedYear, newMonth)
  }

  const getAvailableYears = () => {
    const years = [...new Set(availablePeriods.map(p => p.year))]
    return years.sort((a, b) => b - a) // Tri décroissant
  }

  const getAvailableMonthsForYear = (year) => {
    if (!year) return []

    const monthsForYear = availablePeriods
      .filter(p => p.year.toString() === year.toString())
      .map(p => p.month)

    const uniqueMonths = [...new Set(monthsForYear)].sort((a, b) => b - a) // Tri décroissant

    // Convertir en format lisible
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    return uniqueMonths.map(month => ({
      value: month.toString(),
      label: monthNames[month - 1]
    }))
  }

  const handleClose = () => {
    setError('')
    setLoginHistory([])
    setCurrentPage(1)
    setPagination({
      total_items: 0,
      total_pages: 0,
      current_page: 1,
      page_size: 10
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="login-history-overlay" onClick={handleClose}>
      <div className="login-history-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Historique de connexion</h2>
            <div className="user-info">
              {user?.first_name} {user?.last_name} - {user?.role}
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Chargement de l'historique...</span>
            </div>
          ) : (
            <>
              {loginHistory.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <h3>Aucune connexion enregistrée</h3>
                  <p>Cet utilisateur n'a aucun historique de connexion.</p>
                </div>
              ) : (
                <div className="history-content">
                  <div className="history-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total des connexions :</span>
                      <span className="stat-value">{pagination.total_items}</span>
                    </div>
                  </div>

                  {availablePeriods.length > 0 && (
                    <div className="history-filters">
                      <div className="filter-group">
                        <label htmlFor="year-select">Année :</label>
                        <select
                          id="year-select"
                          value={selectedYear}
                          onChange={(e) => handleYearChange(e.target.value)}
                          className="filter-select"
                        >
                          {getAvailableYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label htmlFor="month-select">Mois :</label>
                        <select
                          id="month-select"
                          value={selectedMonth}
                          onChange={(e) => handleMonthChange(e.target.value)}
                          className="filter-select"
                          disabled={!selectedYear}
                        >
                          {getAvailableMonthsForYear(selectedYear).map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="history-list">
                    {loginHistory.map((log, index) => {
                      const getLogTypeInfo = (type) => {
                        switch (type) {
                          case 'connexion':
                            return { icon: '🔓', label: 'Connexion', className: 'login' }
                          case 'deconnexion':
                            return { icon: '🔒', label: 'Déconnexion', className: 'logout' }
                          default:
                            return { icon: '🔐', label: 'Activité', className: 'activity' }
                        }
                      }

                      const typeInfo = getLogTypeInfo(log.type)

                      return (
                        <div key={log.id || index} className="history-item">
                          <div className={`history-icon ${typeInfo.className}`}>
                            <span>{typeInfo.icon}</span>
                          </div>
                          <div className="history-details">
                            <div className="history-date">
                              {formatDate(log.logged_at)}
                            </div>
                            <div className="history-info">
                              <span className={`history-type ${typeInfo.className}`}>
                                {typeInfo.label}
                              </span>
                              {log.ip_address && (
                                <span className="history-ip">IP: {log.ip_address}</span>
                              )}
                              {log.city && (
                                <span className="history-location">{log.city}, {log.country}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {pagination.total_pages > 1 && (
                    <div className="pagination-section">
                      <div className="pagination-info">
                        Page {pagination.current_page} sur {pagination.total_pages}
                      </div>
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.current_page === 1}
                        >
                          ⏮
                        </button>
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                        >
                          ◀
                        </button>
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.total_pages}
                        >
                          ▶
                        </button>
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(pagination.total_pages)}
                          disabled={pagination.current_page === pagination.total_pages}
                        >
                          ⏭
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserLoginHistoryModal