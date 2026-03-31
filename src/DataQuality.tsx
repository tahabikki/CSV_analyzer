import React from 'react';
import type { DataQualityMetrics } from './types';
import './DataQuality.css';

interface DataQualityProps {
  metrics: DataQualityMetrics;
}

export const DataQuality: React.FC<DataQualityProps> = ({ metrics }) => {
  return (
    <div className="data-quality-container">
      <div className="dq-header">
        <h2>📊 Data Quality Metrics</h2>
        <p>Quality breakdown and invalid REND value analysis</p>
      </div>

      <div className="dq-main-stats">
        <div className="dq-stat-card primary">
          <div className="dq-stat-content">
            <span className="dq-stat-label">Data Purity</span>
            <span className="dq-stat-value">{metrics.purityPercentage.toFixed(1)}%</span>
          </div>
          <div className="dq-stat-bar">
            <div 
              className="dq-bar-fill" 
              style={{ width: `${metrics.purityPercentage}%` }}
            ></div>
          </div>
          <span className="dq-stat-caption">{metrics.validRecords} valid records</span>
        </div>

        <div className="dq-stat-card danger">
          <div className="dq-stat-content">
            <span className="dq-stat-label">Invalid Data</span>
            <span className="dq-stat-value">{metrics.invalidPercentage.toFixed(1)}%</span>
          </div>
          <div className="dq-stat-bar">
            <div 
              className="dq-bar-fill danger" 
              style={{ width: `${metrics.invalidPercentage}%` }}
            ></div>
          </div>
          <span className="dq-stat-caption">
            {metrics.emptyCount + metrics.naCount + metrics.errorCount} invalid records
          </span>
        </div>
      </div>

      <div className="dq-breakdown-section">
        <h3>Invalid REND Breakdown</h3>
        <div className="dq-breakdown-grid">
          <div className="dq-breakdown-item empty">
            <div className="dq-breakdown-icon">📭</div>
            <div className="dq-breakdown-text">
              <span className="dq-breakdown-label">Empty Values</span>
              <span className="dq-breakdown-count">{metrics.emptyCount}</span>
            </div>
            <span className="dq-breakdown-percent">
              {metrics.emptyCount > 0 ? ((metrics.emptyCount / (metrics.emptyCount + metrics.naCount + metrics.errorCount)) * 100).toFixed(0) : 0}%
            </span>
          </div>

          <div className="dq-breakdown-item na">
            <div className="dq-breakdown-icon">⚠️</div>
            <div className="dq-breakdown-text">
              <span className="dq-breakdown-label">N/A Values</span>
              <span className="dq-breakdown-count">{metrics.naCount}</span>
            </div>
            <span className="dq-breakdown-percent">
              {metrics.naCount > 0 ? ((metrics.naCount / (metrics.emptyCount + metrics.naCount + metrics.errorCount)) * 100).toFixed(0) : 0}%
            </span>
          </div>

          <div className="dq-breakdown-item error">
            <div className="dq-breakdown-icon">#️⃣</div>
            <div className="dq-breakdown-text">
              <span className="dq-breakdown-label">Error Codes & Invalid</span>
              <span className="dq-breakdown-count">{metrics.errorCount}</span>
            </div>
            <span className="dq-breakdown-percent">
              {metrics.errorCount > 0 ? ((metrics.errorCount / (metrics.emptyCount + metrics.naCount + metrics.errorCount)) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="dq-info-box">
        <p>
          <strong>💡 Tip:</strong> Higher purity means more reliable performance metrics. 
          Target &gt; 90% for confidence in results.
        </p>
      </div>
    </div>
  );
};
