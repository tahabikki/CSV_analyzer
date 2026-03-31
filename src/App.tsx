import { useState, useEffect } from 'react'
import './App.css'
import { FileUpload } from './FileUpload'
import { DashboardNew } from './DashboardNew'
import { parseFile, aggregatePerformanceData } from './utils'
import type { AggregatedStats, PerformanceRecord } from './types'

interface Diagnostics {
  totalRecords: number
  recordsWithRend: number
  recordsWithoutRend: number
  recordsWithOperateur: number
  recordsWithDate: number
}

function App() {
  const [data, setData] = useState<AggregatedStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [lastUpload, setLastUpload] = useState<{ name: string; time: number } | null>(null)

  const handleFileSelected = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setDiagnostics(null)

    try {
      const records = await parseFile(file)
      
      if (!records || records.length === 0) {
        throw new Error('No records found in file')
      }
      
      // Calculate diagnostics
      const diag: Diagnostics = {
        totalRecords: records.length,
        recordsWithRend: records.filter(r => r.rend !== null && r.rend !== undefined && !isNaN(r.rend)).length,
        recordsWithoutRend: records.filter(r => r.rend === null || r.rend === undefined || isNaN(r.rend || 0)).length,
        recordsWithOperateur: records.filter(r => r.operateur && r.operateur.trim() !== '').length,
        recordsWithDate: records.filter(r => r.date && r.date.trim() !== '').length,
      }
      
      setDiagnostics(diag)
      
      const aggregated = aggregatePerformanceData(records)
      
      if (!aggregated || !aggregated.byDay || aggregated.byDay.length === 0) {
        throw new Error('No valid data after processing. Check that Date and Operator columns exist.')
      }
      
      setData(aggregated)
      localStorage.setItem('perfoplas.lastData', JSON.stringify(aggregated))
      const meta = { name: file.name, time: Date.now() }
      localStorage.setItem('perfoplas.lastUpload', JSON.stringify(meta))
      setLastUpload(meta)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file'
      setError(errorMsg)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load a small built-in sample dataset to preview the dashboard
  const loadSampleData = () => {
    const sampleRecords: PerformanceRecord[] = [
      { date: '2024-01-05', operateur: 'Ali', rend: 92, design: '', designation: '', isValid: true, rawRend: '92' },
      { date: '2024-01-06', operateur: 'Sara', rend: 75, design: '', designation: '', isValid: true, rawRend: '75' },
      { date: '2024-01-06', operateur: 'Ali', rend: 88, design: '', designation: '', isValid: true, rawRend: '88' },
      { date: '2024-02-02', operateur: 'Hassan', rend: 65, design: '', designation: '', isValid: true, rawRend: '65' },
      { date: '2024-02-02', operateur: 'Sara', rend: null, design: '', designation: '', isValid: false, rawRend: '' },
    ];

    const aggregated = aggregatePerformanceData(sampleRecords as any);
    setData(aggregated);

    const diag: Diagnostics = {
      totalRecords: sampleRecords.length,
      recordsWithRend: sampleRecords.filter(r => r.rend !== null && !isNaN(r.rend as any)).length,
      recordsWithoutRend: sampleRecords.filter(r => r.rend === null || isNaN(r.rend as any)).length,
      recordsWithOperateur: sampleRecords.filter(r => r.operateur && r.operateur.trim() !== '').length,
      recordsWithDate: sampleRecords.filter(r => r.date && r.date.trim() !== '').length,
    };
    setDiagnostics(diag);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('perfoplas.lastData')
      if (raw) setData(JSON.parse(raw))
      const meta = localStorage.getItem('perfoplas.lastUpload')
      if (meta) setLastUpload(JSON.parse(meta))
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 REND Performance Analytics</h1>
          <p>Upload your performance data and analyze Rendement metrics</p>
        </div>
      </header>

      <main className="app-main">
        <div className="app-layout">
          <aside className="sidebar">
            {/* Full-width upload section */}
            <div className="upload-full-width">
              <FileUpload onFileSelected={handleFileSelected} isLoading={isLoading} />
            </div>

            {/* Recent upload section */}
            {lastUpload && (
              <div className="upload-full-width">
                <div className="recent-upload">
                  <h4>Recent Upload</h4>
                  <div className="recent-meta">
                    <div className="recent-name">{lastUpload.name}</div>
                    <div className="recent-time">{new Date(lastUpload.time).toLocaleString()}</div>
                  </div>
                  <div className="recent-actions">
                    <button
                      className="restore-btn"
                      onClick={() => {
                        try {
                          const raw = localStorage.getItem('perfoplas.lastData')
                          if (raw) setData(JSON.parse(raw))
                        } catch (e) {}
                      }}
                    >
                      ♻️ Restore
                    </button>
                    <button
                      className="clear-btn"
                      onClick={() => {
                        try {
                          localStorage.removeItem('perfoplas.lastData')
                          localStorage.removeItem('perfoplas.lastUpload')
                        } catch (e) {}
                        setData(null)
                        setDiagnostics(null)
                        setLastUpload(null)
                      }}
                    >
                      ✖️ Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Two-column button grid */}
            <div className="buttons-grid">
              <button className="sample-btn wow-btn" onClick={loadSampleData}>
                <span className="btn-icon">▶️</span>
                <span className="btn-text">Load Example Data</span>
              </button>

              <a className="download-btn wow-btn" href="/sample_data.csv" download>
                <span className="btn-icon">⬇️</span>
                <span className="btn-text">Download Example CSV</span>
              </a>
            </div>

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
          </aside>

          <section className="main-content">
            {isLoading && (
              <div className="loading-indicator">
                <p>📊 Processing file...</p>
              </div>
            )}
            
            {error && (
              <div className="error-box">
                <h3>❌ Error Processing File</h3>
                <p>{error}</p>
                <p><strong>Troubleshooting:</strong></p>
                <ul>
                  <li>✓ File should have a "Date" or "Date d'enroulage" column</li>
                  <li>✓ File should have an "Operator" or "Opérateur" column</li>
                  <li>✓ File format should be CSV, XLSX, or XLSM</li>
                  <li>✓ File should not be empty</li>
                </ul>
              </div>
            )}
            
            {!isLoading && !error && !data && (
              <div className="empty-state">
                <div className="empty-state-content">
                  <div className="empty-state-icon">📊</div>
                  <h2>Ready to Analyze</h2>
                  <p className="empty-state-subtitle">Upload a production data file or click "Load Example Data" to get started</p>
                  <div className="empty-state-features">
                    <div className="feature-item">
                      <span className="feature-icon">📁</span>
                      <span className="feature-text">CSV, XLSX, XLS files</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">⚡</span>
                      <span className="feature-text">Real-time Analysis</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">📈</span>
                      <span className="feature-text">Performance Metrics</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!isLoading && data && (
              <>
                <DashboardNew data={data} diagnostics={diagnostics} />

                {diagnostics && diagnostics.recordsWithRend < diagnostics.totalRecords * 0.1 && (
                  <div className="warning-box">
                    <strong>⚠️ Warning:</strong> Only {diagnostics.recordsWithRend} out of {diagnostics.totalRecords} records have valid REND values. This might indicate the REND column wasn't detected correctly.
                  </div>
                )}



                <div className="action-footer">
                  <button
                    className="new-file-btn"
                    onClick={() => {
                      setData(null)
                      setError(null)
                      setDiagnostics(null)
                    }}
                  >
                    Upload Another File
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
