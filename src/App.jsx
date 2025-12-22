import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (file) => {
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

    setSelectedFile(file)
    setExtractionResult(null)
    setCsvData(null)
    setShowPreview(false)
    setError(null)
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
    setExtractionResult(null)
    setCsvData(null)
    setShowPreview(false)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExtractData = async () => {
    if (!selectedFile) return

    setIsExtracting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://127.0.0.1:8000/api/v1/ocr/upload-pdf-csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setExtractionResult(result)
      } else {
        throw new Error('Échec de l\'extraction des données')
      }

    } catch (error) {
      console.error('Erreur lors de l\'extraction:', error)
      setError(error.message)
    } finally {
      setIsExtracting(false)
    }
  }

  const handlePreviewCSV = async () => {
    if (!extractionResult?.download_url) return

    try {
      const response = await fetch(extractionResult.download_url)

      if (!response.ok) {
        throw new Error(`Erreur de prévisualisation: ${response.status}`)
      }

      const csvText = await response.text()
      const lines = csvText.split('\n').filter(line => line.trim())
      const headers = lines[0]?.split(',') || []
      const rows = lines.slice(1, 11).map(line => line.split(','))

      setCsvData({
        headers,
        rows,
        totalRows: lines.length - 1,
        hasMore: lines.length > 11
      })
      setShowPreview(true)

    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error)
      setError('Erreur lors de la prévisualisation du fichier CSV')
    }
  }

  const handleDownloadCSV = async () => {
    if (!extractionResult?.download_url) return

    try {
      const response = await fetch(extractionResult.download_url)

      if (!response.ok) {
        throw new Error(`Erreur de téléchargement: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = extractionResult.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      setError('Erreur lors du téléchargement du fichier CSV')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Téléchargement de PDF</h1>
          <p>Sélectionnez un fichier PDF à traiter</p>
        </header>

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
                  <p>Type: {selectedFile.type}</p>
                </div>
              </div>

              <div className="file-actions">
                <button
                  className="remove-btn"
                  onClick={handleRemoveFile}
                  disabled={isExtracting}
                >
                  Supprimer
                </button>
                <button
                  className="extract-btn"
                  onClick={handleExtractData}
                  disabled={isExtracting}
                >
                  {isExtracting ? (
                    <span className="loading-spinner">
                      <span className="spinner"></span>
                      Extraction...
                    </span>
                  ) : (
                    'Extraire'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="file-status">
            <div className="status-indicator error">
              ❌ {error}
            </div>
          </div>
        )}

        {selectedFile && !error && !extractionResult && (
          <div className="file-status">
            <div className="status-indicator success">
              ✅ Fichier prêt pour le traitement
            </div>
          </div>
        )}

        {extractionResult && (
          <div className="extraction-results">
            <div className="results-header">
              <h3>📊 Résultats de l'extraction</h3>
            </div>
            <div className="results-content">
              <div className="result-item">
                <span className="label">Fichier CSV généré :</span>
                <span className="value">{extractionResult.filename}</span>
              </div>
              <div className="result-item">
                <span className="label">Studio Parfums trouvés :</span>
                <span className="value">{extractionResult.total_studio_parfums_found}</span>
              </div>
              <button
                className="download-btn"
                onClick={handleDownloadCSV}
              >
                📥 Télécharger le CSV
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
