import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { isValidRend } from './utils';
import type { AggregatedStats } from './types';
import './DashboardNew.css';

interface Diagnostics {
  totalRecords: number;
  recordsWithRend: number;
  recordsWithoutRend: number;
  recordsWithOperateur: number;
  recordsWithDate: number;
}

interface DashboardNewProps {
  data?: AggregatedStats | null;
  diagnostics?: Diagnostics | null;
}

interface Filters {
  operateur: string;
  startDate: string;
  endDate: string;
}

// Helper: Get color based on efficiency value
const getEfficiencyColor = (value: number) => {
  if (value >= 90) return '#10b981'; // Green
  if (value >= 70) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

// Helper: Format REND values - only show % for valid numbers, empty for null/undefined/NaN
const formatRend = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    if (value === '' || value.toLowerCase() === '#n/a') return value === '' ? '' : 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}%`;
  }
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    return `${value.toFixed(2)}%`;
  }
  return '';
};

export const DashboardNew: React.FC<DashboardNewProps> = ({ data, diagnostics }) => {
  const [expandedSections, setExpandedSections] = useState({
    advancedAnalysis: false,
    rawData: false,
  });
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'operator'>('daily');
  const [filters, setFilters] = useState<Filters>({
    operateur: 'all',
    startDate: '',
    endDate: '',
  });

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <h2>📊 Production Analysis Ready</h2>
          <p>Upload a CSV or XLSX file to begin</p>
        </div>
      </div>
    );
  }

  if (!data.byDay || data.byDay.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="section">
          <h2>⚠️ No Data Detected</h2>
          <p>The file was uploaded but no valid records were found with Date and Operator data.</p>
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            <li>Check that your file has a "Date d'enroulage" column</li>
            <li>Check that your file has an "Opérateur" column</li>
            <li>Check that your file has a "REND" or performance column</li>
          </ul>
        </div>
      </div>
    );
  }

  // Get unique operators
  const uniqueOperateurs = ['all', ...Array.from(new Set(data.byDay.map(d => d.operateur))).sort()];

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = data.byDay;

    if (filters.operateur !== 'all') {
      filtered = filtered.filter(d => d.operateur === filters.operateur);
    }

    return filtered;
  }, [data.byDay, filters]);

  // Calculate KPIs from filtered data
  const kpis = useMemo(() => {
    if (filteredData.length === 0) return null;

    const totalValidRecords = filteredData.reduce((sum, d) => sum + (d.validCount || 0), 0);
    // Include ALL days with valid REND data weighted by number of valid records
    // This prevents bias toward days with few records
    const validRends = filteredData.filter(d => d.avgRend !== null && typeof d.avgRend === 'number' && !isNaN(d.avgRend));
    const avgEfficiency = validRends.length > 0
      ? validRends.reduce((sum, d) => sum + ((d.avgRend as number) * (d.validCount || 1)), 0) / 
        validRends.reduce((sum, d) => sum + (d.validCount || 1), 0)
      : 0;

    return {
      totalRecords: filteredData.length,
      totalValidRecords,
      avgEfficiency,
    };
  }, [filteredData]);

  // Operator performance ranking - only include records with VALID REND values
  const operatorPerformance = useMemo(() => {
    const opMap = new Map<string, { rend: number[]; count: number; validCount: number }>();
    data.byDay.forEach(d => {
      if (!opMap.has(d.operateur)) {
        opMap.set(d.operateur, { rend: [], count: 0, validCount: 0 });
      }
      const op = opMap.get(d.operateur)!;
      // Use dynamic REND validation - only include records with valid REND values
      if (isValidRend(d.avgRend) && typeof d.avgRend === 'number' && !isNaN(d.avgRend)) {
        op.rend.push(d.avgRend);
        op.validCount += 1;
      }
      op.count += 1;
    });

    return Array.from(opMap.entries())
      .map(([name, stats]) => ({
        name,
        avgRend: stats.rend.length > 0 ? stats.rend.reduce((a, b) => a + b, 0) / stats.rend.length : null,
        count: stats.count,
        validCount: stats.validCount,
        hasValidData: stats.rend.length > 0,
        validPercentage: stats.count > 0 ? (stats.validCount / stats.count) * 100 : 0,
      }))
      .filter(op => {
        // Must have at least 1 valid record
        if (!op.hasValidData || op.validCount === 0) return false;
        // Must have avgRend as valid number
        if (op.avgRend === null || typeof op.avgRend !== 'number' || !isValidRend(op.avgRend)) return false;
        // Must have at least 50% valid data (reasonable threshold)
        // This allows operators with some data quality issues but mostly clean data
        if (op.validPercentage < 50) return false;
        return true;
      })
      .sort((a, b) => (a.avgRend || 0) - (b.avgRend || 0));
  }, [data.byDay]);

  return (
    <div className="dashboard-container">
      {/* ===== SECTION 0: STICKY FILTERS ===== */}
      <div className="section section-entry">
        <div className="filter-bar sticky-filters">
          <div className="view-buttons">
            <button 
              className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              📅 Daily View
            </button>
            <button 
              className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              📊 Monthly View
            </button>
            <button 
              className={`view-btn ${viewMode === 'operator' ? 'active' : ''}`}
              onClick={() => setViewMode('operator')}
            >
              👥 By Operator
            </button>
          </div>
          
          <div className="filter-group">
            <label>Filter Operator:</label>
            <select
              value={filters.operateur}
              onChange={(e) => setFilters({ ...filters, operateur: e.target.value })}
            >
              <option value="all">All Operators</option>
              {uniqueOperateurs.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== SECTION 1: GLOBAL OVERVIEW ===== */}
      {kpis && (
        <div className="section section-overview">
          <h2>🎯 GLOBAL OVERVIEW – Are we performing well?</h2>

          <div className="kpi-grid">
            {/* Total Records */}
            <div className="kpi-card">
              <div className="kpi-label">Total Records</div>
              <div className="kpi-value" style={{ color: '#2563eb' }}>
                {kpis.totalRecords}
              </div>
              <div className="kpi-unit">Days tracked</div>
            </div>

            {/* Valid Records */}
            <div className="kpi-card">
              <div className="kpi-label">Valid Records</div>
              <div className="kpi-value" style={{ color: '#0ea5e9' }}>
                {kpis.totalValidRecords}
              </div>
              <div className="kpi-unit">Records with data</div>
            </div>

            {/* Records with Missing % */}
            {diagnostics && (
              <div className="kpi-card">
                <div className="kpi-label">Missing % Values</div>
                <div className="kpi-value" style={{ color: diagnostics.recordsWithoutRend > 0 ? '#ef4444' : '#10b981' }}>
                  {diagnostics.recordsWithoutRend}
                </div>
                <div className="kpi-unit">
                  No REND data
                  {diagnostics.totalRecords > 0 && (
                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      ({((diagnostics.recordsWithoutRend / diagnostics.totalRecords) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Average Efficiency */}
            <div className="kpi-card">
              <div
                className="kpi-value"
                style={{ color: getEfficiencyColor(kpis.avgEfficiency) }}
              >
                {kpis.avgEfficiency.toFixed(1)}%
              </div>
              <div className="kpi-label">Average Efficiency</div>
              <div className="kpi-unit">%Rendement</div>
            </div>
          </div>

          {/* Quick Chart */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>📊 Efficiency by Day</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredData.map(d => ({ name: d.date, value: d.avgRend !== null ? d.avgRend : null })).filter(d => d.value !== null)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gauge */}
            <div className="chart-card">
              <h3>⚡ Performance Status</h3>
              <div className="gauge-container">
                <div className="gauge-value" style={{ color: getEfficiencyColor(kpis.avgEfficiency) }}>
                  {kpis.avgEfficiency.toFixed(1)}%
                </div>
                <div className="gauge-label">
                  {kpis.avgEfficiency >= 90 ? '✅ Excellent' : kpis.avgEfficiency >= 70 ? '⚠️ Good' : '❌ Needs Attention'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECTION 5: HUMAN PERFORMANCE ===== */}
      {operatorPerformance.length > 0 && (
        <div className="section section-operators">
          <h2>👷 HUMAN PERFORMANCE</h2>

          <div className="operator-grid">
            {/* Top Operator */}
            <div className="performance-card best">
              <h3>🏆 Best Operator</h3>
              {operatorPerformance[operatorPerformance.length - 1] && (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {operatorPerformance[operatorPerformance.length - 1].name}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', margin: '0.5rem 0' }}>
                    {formatRend(operatorPerformance[operatorPerformance.length - 1].avgRend)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {operatorPerformance[operatorPerformance.length - 1].count} records
                  </div>
                </>
              )}
            </div>

            {/* Worst Operator */}
            <div className="performance-card worst">
              <h3>⚠️ Needs Attention</h3>
              {operatorPerformance.length > 0 && operatorPerformance[0] && (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {operatorPerformance[0].name}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444', margin: '0.5rem 0' }}>
                    {formatRend(operatorPerformance[0].avgRend)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {operatorPerformance[0].validCount} records
                  </div>
                </>
              )}
            </div>

            {/* All Operators Ranking */}
            <div className="performance-card ranking">
              <h3>📊 Operator Ranking</h3>
              <div className="ranking-list">
                {operatorPerformance.slice(0, 5).map((op, idx) => (
                  <div key={idx} className="ranking-item">
                    <span className="ranking-index">{idx + 1}</span>
                    <span className="ranking-name">{op.name}</span>
                    <span
                      className="ranking-value"
                      style={{ color: op.avgRend !== null ? getEfficiencyColor(op.avgRend) : '#999' }}
                    >
                      {formatRend(op.avgRend)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW SECTIONS: DAILY / MONTHLY / BY OPERATOR ===== */}
      
      {viewMode === 'daily' && data.byDay.length > 0 && (
        <div className="section section-daily">
          <h2>📈 Daily Performance Analysis</h2>
          
          {/* Daily Chart */}
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} label={{ value: 'REND (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: any) => `${(value || 0).toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="avgRend" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Avg REND" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Table */}
          <div className="table-section">
            <h3>Daily Details</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Operator</th>
                  <th>Avg REND (%)</th>
                  <th>Valid / Total</th>
                </tr>
              </thead>
              <tbody>
                {data.byDay.map((d, idx) => (
                  <tr key={idx}>
                    <td>{d.date}</td>
                    <td>{d.operateur}</td>
                    <td className={d.avgRend !== null && d.avgRend >= 90 ? 'high' : d.avgRend !== null && d.avgRend >= 70 ? 'medium' : 'low'}>
                      {formatRend(d.avgRend)}
                    </td>
                    <td>{d.validCount} / {d.recordCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'monthly' && data.byMonth.length > 0 && (
        <div className="section section-monthly">
          <h2>📅 Monthly Performance Summary</h2>
          
          {/* Group data by month for overall chart */}
          {(() => {
            const monthlyOverall = new Map<string, { sum: number; count: number; records: number }>();
            data.byMonth.forEach((m: any) => {
              if (!monthlyOverall.has(m.month)) {
                monthlyOverall.set(m.month, { sum: 0, count: 0, records: 0 });
              }
              const stats = monthlyOverall.get(m.month)!;
              if (m.avgRend !== null) {
                stats.sum += m.avgRend;
                stats.count += 1;
              }
              stats.records += m.recordCount;
            });

            const monthlyChartData = Array.from(monthlyOverall.entries()).map(([month, s]) => ({
              month,
              avgRend: s.count > 0 ? s.sum / s.count : null
            }));

            return (
              <>
                {/* Monthly Overall Chart */}
                <div className="chart-card">
                  <h3>Overall Monthly Performance</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={(m: any) => {
                        const [y, mm] = String(m).split('-');
                        const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        return names[parseInt(mm)-1] + ' ' + y;
                      }} />
                      <YAxis domain={[0, 100]} label={{ value: 'REND (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value: any) => `${(value || 0).toFixed(2)}%`} />
                      <Bar dataKey="avgRend" fill="#10b981" radius={[8, 8, 0, 0]} name="Avg REND" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Operator Performance by Month Table */}
                <div className="table-section">
                  <h3>📊 Operator Performance by Month</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Operator</th>
                        <th>Avg REND (%)</th>
                        <th>Records</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byMonth
                        .sort((a: any, b: any) => {
                          const cmp = a.month.localeCompare(b.month);
                          return cmp !== 0 ? cmp : (a.operateur || '').localeCompare(b.operateur || '');
                        })
                        .map((m: any, idx: any) => {
                          const [y, mm] = String(m.month).split('-');
                          const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          const monthName = names[parseInt(mm)-1] + ' ' + y;
                          return (
                            <tr key={idx}>
                              <td><strong>{monthName}</strong></td>
                              <td>{m.operateur || 'N/A'}</td>
                              <td className={m.avgRend !== null && m.avgRend >= 90 ? 'high' : m.avgRend !== null && m.avgRend >= 70 ? 'medium' : 'low'}>
                                {formatRend(m.avgRend)}
                              </td>
                              <td title={`Individual records for this operator in this month`}>{m.recordCount}</td>
                              <td>
                                {m.avgRend !== null && m.avgRend >= 90 ? '🟢 Excellent' : m.avgRend !== null && m.avgRend >= 70 ? '🟡 Good' : m.avgRend !== null ? '🔴 Needs Attention' : '⚠️ No Data'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {viewMode === 'operator' && operatorPerformance.length > 0 && (
        <div className="section section-operator-detail">
          <h2>👥 Operator Performance Rankings</h2>
          
          {/* Operator Table */}
          <div className="table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Operator</th>
                  <th>Avg REND (%)</th>
                  <th>Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {operatorPerformance.map((op, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{op.name}</strong></td>
                    <td className={op.avgRend !== null && op.avgRend >= 90 ? 'high' : op.avgRend !== null && op.avgRend >= 70 ? 'medium' : 'low'}>
                      {formatRend(op.avgRend)}
                    </td>
                    <td>{op.count}</td>
                    <td>
                      {op.avgRend !== null && op.avgRend >= 90 ? '🟢 Excellent' : op.avgRend !== null && op.avgRend >= 70 ? '🟡 Good' : '🔴 Low'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== SECTION 7: SUMMARY & ADVANCED ANALYSIS (COMBINED) ===== */}
      <div className="section section-summary-advanced">
        <button
          className="section-toggle"
          onClick={() =>
            setExpandedSections({
              ...expandedSections,
              advancedAnalysis: !expandedSections.advancedAnalysis,
            })
          }
        >
          {expandedSections.advancedAnalysis ? '▼' : '▶'} Summary and Advanced Analysis
        </button>

        {expandedSections.advancedAnalysis && (
          <div className="summary-advanced-content">
            
            {/* Performance Summary Cards */}
            <div className="summary-cards-section">
              <h3>Performance Summary</h3>
              <div className="summary-cards-grid">
                <div className="summary-card summary-card-primary">
                  <div className="card-icon">📊</div>
                  <h4>Overall Performance</h4>
                  {data.overall.avgRend !== null ? (
                    <div className="card-value" style={{color: getEfficiencyColor(data.overall.avgRend)}}>{data.overall.avgRend.toFixed(2)}%</div>
                  ) : (
                    <div className="card-value" style={{color: '#9ca3af'}}>N/A</div>
                  )}
                  <div className="card-label">Average REND</div>
                </div>
                
                <div className="summary-card summary-card-success">
                  <div className="card-icon">✅</div>
                  <h4>Data Quality</h4>
                  <div className="card-value">{data.overall.purity.toFixed(1)}%</div>
                  <div className="card-label">Valid Records</div>
                </div>
                
                <div className="summary-card summary-card-info">
                  <div className="card-icon">📈</div>
                  <h4>Total Records</h4>
                  <div className="card-value">{data.overall.totalRecords}</div>
                  <div className="card-label">Processed</div>
                </div>
              </div>
            </div>

            {/* Data Quality Breakdown Cards */}
            <div className="data-quality-section">
              <h3>Data Quality Breakdown</h3>
              <div className="quality-cards-grid">
                <div className="quality-card card-with-rend">
                  <h4>📊 Records with REND</h4>
                  <div className="quality-value">{data.overall.totalRecords - (data.overall.totalRecords - data.byDay.length)}</div>
                  <div className="quality-percentage">{((data.byDay.length / data.overall.totalRecords) * 100).toFixed(1)}%</div>
                </div>
                
                <div className="quality-card card-without-rend">
                  <h4>⚠️ Records without REND</h4>
                  <div className="quality-value">{data.overall.totalRecords - data.byDay.length}</div>
                  <div className="quality-percentage">{(((data.overall.totalRecords - data.byDay.length) / data.overall.totalRecords) * 100).toFixed(1)}%</div>
                </div>
                
                <div className="quality-card card-with-operator">
                  <h4>👤 Records with Operator</h4>
                  <div className="quality-value">{data.byDay.length}</div>
                  <div className="quality-percentage">{((data.byDay.length / data.overall.totalRecords) * 100).toFixed(1)}%</div>
                </div>
                
                <div className="quality-card card-with-date">
                  <h4>📅 Records with Date</h4>
                  <div className="quality-value">{data.byDay.length}</div>
                  <div className="quality-percentage">{((data.byDay.length / data.overall.totalRecords) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Raw Data Table */}
            <div className="raw-data-section">
              <h3>Raw Data Details</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Operator</th>
                    <th>REND (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDay.map((d, idx) => (
                    <tr key={idx} className={d.validCount > 0 ? 'valid-row' : 'invalid-row'}>
                      <td className="date-cell">{d.date}</td>
                      <td className="operator-cell"><strong>{d.operateur}</strong></td>
                      <td className={d.avgRend !== null && d.avgRend >= 90 ? 'high' : d.avgRend !== null && d.avgRend >= 70 ? 'medium' : 'low'}>
                        {d.avgRend !== null ? d.avgRend.toFixed(2) + '%' : 'N/A'}
                      </td>
                      <td className="status-cell">
                        {d.validCount > 0 ? <span className="badge-valid">✓ Valid</span> : <span className="badge-invalid">✗ Invalid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
