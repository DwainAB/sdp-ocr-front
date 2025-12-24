import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
      setIsAuthenticated(true)
    }

    // Déconnexion automatique à la fermeture de l'onglet
    const handleBeforeUnload = () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (currentUser?.id) {
        console.log(`Beacon déconnexion pour user ID: ${currentUser.id}`)
        // Signal synchrone pour la fermeture
        const blob = new Blob([JSON.stringify({ is_online: false })], {
          type: 'application/json'
        })
        navigator.sendBeacon(
          `http://0.0.0.0:8000/api/v1/users/${currentUser.id}/login-status`,
          blob
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const getUserFromDatabase = async (email) => {
    try {
      const res = await fetch(
          `http://0.0.0.0:8000/api/v1/users?email=${email}`
      )
      if (!res.ok) return null
      const data = await res.json()
      const users = data.users || data || []
      const user = users.find(
          u => u.email?.toLowerCase() === email.toLowerCase()
      )
      return user || null
    } catch {
      return null
    }
  }

  const signalUserConnection = async (userId) => {
    try {
      console.log(`Signaler connexion pour user ID: ${userId}`)
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${userId}/login-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: true })
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        const error = await response.text()
        console.error('Erreur API:', error)
      } else {
        console.log('Statut de connexion mis à jour avec succès')
      }
    } catch (error) {
      console.error('Erreur lors du signal de connexion:', error)
    }
  }

  const loginWithGoogle = async (accessToken) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      // 1. Récupérer les infos Google
      const res = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
      )

      if (!res.ok) throw new Error('Google userinfo error')

      const googleUser = await res.json()

      // 2. Récupérer l'utilisateur complet de la base de données
      const dbUser = await getUserFromDatabase(googleUser.email)
      if (!dbUser) {
        setAuthError('Accès refusé. Votre email n\'est pas autorisé.')
        setIsLoading(false)
        return
      }

      // 3. Signaler la connexion de l'utilisateur
      await signalUserConnection(dbUser.id)

      // 4. Combiner les données Google et de la base
      const userData = {
        id: dbUser.id,
        email: dbUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        role: dbUser.role,
        team: dbUser.team,
        is_online: true
      }

      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem('user', JSON.stringify(userData))

      console.log('Utilisateur connecté:', userData)
    } catch (err) {
      console.error('Erreur lors de la connexion:', err)
      setAuthError('Erreur lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const signalUserDisconnection = async (userId) => {
    try {
      console.log(`Signaler déconnexion pour user ID: ${userId}`)
      const response = await fetch(`http://0.0.0.0:8000/api/v1/users/${userId}/login-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: false })
      })
      console.log('Response status déconnexion:', response.status)
      if (!response.ok) {
        const error = await response.text()
        console.error('Erreur API déconnexion:', error)
      } else {
        console.log('Statut de déconnexion mis à jour avec succès')
      }
    } catch (error) {
      console.error('Erreur lors du signal de déconnexion:', error)
    }
  }

  const logout = async () => {
    if (user?.id) {
      await signalUserDisconnection(user.id)
    }

    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
  }

  return (
      <AuthContext.Provider
          value={{
            user,
            isAuthenticated,
            isLoading,
            authError,
            loginWithGoogle,
            logout,
            clearAuthError: () => setAuthError(null)
          }}
      >
        {children}
      </AuthContext.Provider>
  )
}
