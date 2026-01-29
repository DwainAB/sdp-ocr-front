import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/UI/Toast'
import { quotasApi } from '../../services/api'
import * as pdfjsLib from 'pdfjs-dist'
import './ExtractionPage.css'

// Configuration du worker PDF.js (copié dans /public)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const API_URL = import.meta.env.VITE_API_URL
const SECONDS_PER_PAGE = 3.5

const ExtractionPage = () => {
  const { user } = useAuth()
  const { showQuotaError, showSuccess } = useToast()
  const [selectedFile, setSelectedFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const fileInputRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const startTimeRef = useRef(null)

  // Nettoyer l'intervalle lors du démontage
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Fonction pour compter les pages du PDF
  const countPdfPages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      return pdf.numPages
    } catch (error) {
      console.error('Erreur lors du comptage des pages:', error)
      return 0
    }
  }

  const handleFileSelect = async (file) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier PDF valide')
      return
    }

    const maxSize = 100 * 1024 * 1024 // 100MB en bytes
    if (file.size > maxSize) {
      setError('Le fichier est trop volumineux. Taille maximale autorisée : 100MB')
      return
    }

    // Compter les pages du PDF
    const pages = await countPdfPages(file)
    setPageCount(pages)

    // Calculer le temps estimé
    const estimated = Math.ceil(pages * SECONDS_PER_PAGE)
    setEstimatedTime(estimated)

    setSelectedFile(file)
    setExtractionComplete(false)
    setError(null)
    setProgress(0)
    setElapsedTime(0)
  }

  const handleFileInputChange = (event) => {
    const file = event.target.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPageCount(0)
    setExtractionComplete(false)
    setError(null)
    setProgress(0)
    setElapsedTime(0)
    setEstimatedTime(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }

  const startProgressAnimation = () => {
    startTimeRef.current = Date.now()
    const totalDuration = estimatedTime * 1000 // en millisecondes

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const elapsedSeconds = Math.floor(elapsed / 1000)
      setElapsedTime(elapsedSeconds)

      // Progression jusqu'à 95% basée sur le temps estimé
      // On garde 5% pour la fin réelle de l'extraction
      const calculatedProgress = Math.min((elapsed / totalDuration) * 95, 95)
      setProgress(calculatedProgress)
    }, 100)
  }

  const stopProgressAnimation = (success = true) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (success) {
      setProgress(100)
    }
  }

  const handleExtractData = async () => {
    if (!selectedFile) return

    setIsExtracting(true)
    setError(null)
    setProgress(0)
    setElapsedTime(0)

    // Démarrer l'animation de progression
    startProgressAnimation()

    try {
      // Vérifier et consommer le quota PDF avant l'extraction
      if (user?.id) {
        try {
          await quotasApi.consumePdfQuota(user.id)
        } catch (quotaError) {
          if (quotaError.status === 429) {
            showQuotaError(quotaError.detail || { type: 'pdf' })
            stopProgressAnimation(false)
            setIsExtracting(false)
            setProgress(0)
            return
          }
          throw quotaError
        }
      }

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_URL}/api/v1/ocr/upload-pdf-csv`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        stopProgressAnimation(true)
        setExtractionComplete(true)
        showSuccess('Extraction terminée', `${pageCount} pages traitées avec succès`)
      } else {
        throw new Error('Échec de l\'extraction des données')
      }

    } catch (error) {
      console.error('Erreur lors de l\'extraction:', error)
      stopProgressAnimation(false)
      setError(error.message)
      setProgress(0)
    } finally {
      setIsExtracting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}min ${remainingSeconds}s`
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <h2>Extraction de données PDF</h2>
        <p>Sélectionnez un fichier PDF à traiter</p>
      </div>

      <div className="upload-section">
        {!selectedFile ? (
          <div
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <div className="upload-icon">📄</div>
            <h3>Glissez-déposez votre PDF ici</h3>
            <p>ou cliquez pour sélectionner un fichier</p>
            <button className="select-btn">Sélectionner un fichier</button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon">📋</div>
              <div className="file-details">
                <h3>{selectedFile.name}</h3>
                <p>Taille: {formatFileSize(selectedFile.size)}</p>
                <p>Pages: {pageCount}</p>
                {estimatedTime > 0 && !isExtracting && !extractionComplete && (
                  <p className="estimated-time">
                    Temps estimé: ~{formatTime(estimatedTime)}
                  </p>
                )}
              </div>
            </div>

            {!isExtracting && !extractionComplete && (
              <div className="file-actions">
                <button
                  className="remove-btn"
                  onClick={handleRemoveFile}
                >
                  Supprimer
                </button>
                <button
                  className="extract-btn"
                  onClick={handleExtractData}
                >
                  Extraire
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {isExtracting && (
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-title">Extraction en cours...</span>
            <span className="progress-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-info">
            <span className="elapsed-time">
              Temps écoulé: {formatTime(elapsedTime)}
            </span>
            <span className="remaining-time">
              Temps restant: ~{formatTime(Math.max(0, estimatedTime - elapsedTime))}
            </span>
          </div>
          <p className="progress-hint">
            Traitement de {pageCount} pages...
          </p>
          <div className="progress-warning">
            <span className="warning-icon">⚠</span>
            <span>Veuillez ne pas quitter cette page pendant l'extraction</span>
          </div>
        </div>
      )}

      {error && (
        <div className="file-status">
          <div className="status-indicator error">
            {error}
          </div>
        </div>
      )}

      {selectedFile && !error && !extractionComplete && !isExtracting && (
        <div className="file-status">
          <div className="status-indicator success">
            Fichier prêt pour le traitement
          </div>
        </div>
      )}

      {extractionComplete && (
        <div className="extraction-complete">
          <div className="complete-icon">✓</div>
          <h3>Extraction terminée avec succès</h3>
          <p>{pageCount} pages ont été traitées</p>
          <button
            className="new-extraction-btn"
            onClick={handleRemoveFile}
          >
            Nouvelle extraction
          </button>
        </div>
      )}
    </div>
  )
}

export default ExtractionPage
