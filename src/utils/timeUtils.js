export const getTimeAgo = (dateString) => {
  if (!dateString) return 'Jamais connecté'

  const now = new Date()
  const date = new Date(dateString)
  const diffInMs = now - date

  // Si la date est dans le futur, retourner "maintenant"
  if (diffInMs < 0) return 'maintenant'

  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? 'il y a 1 seconde' : `il y a ${diffInSeconds} secondes`
  }

  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? 'il y a 1 minute' : `il y a ${diffInMinutes} minutes`
  }

  if (diffInHours < 24) {
    return diffInHours === 1 ? 'il y a 1 heure' : `il y a ${diffInHours} heures`
  }

  if (diffInDays < 7) {
    return diffInDays === 1 ? 'il y a 1 jour' : `il y a ${diffInDays} jours`
  }

  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? 'il y a 1 semaine' : `il y a ${diffInWeeks} semaines`
  }

  if (diffInMonths < 12) {
    return diffInMonths === 1 ? 'il y a 1 mois' : `il y a ${diffInMonths} mois`
  }

  return diffInYears === 1 ? 'il y a 1 an' : `il y a ${diffInYears} ans`
}

export const formatLastLogin = (lastLoginAt, isOnline) => {
  if (isOnline) {
    return 'En ligne'
  }

  return getTimeAgo(lastLoginAt)
}