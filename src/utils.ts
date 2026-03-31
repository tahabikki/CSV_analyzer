import * as XLSX from 'xlsx';
import type { PerformanceRecord, AggregatedStats, DailyOperatorStats, ProductionRecord, ProductionStats } from './types';

// Helper to normalize strings for comparison (like the HTML version)
function normHeader(v: string | unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^a-z0-9% ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ✅ UNIVERSAL REND VALIDATION
 * Dynamically checks if a value is a valid REND (excludes errors, #N/A, etc.)
 * Works across all code: parsing, aggregation, and display
 */
export function isValidRend(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') {
    // Must be a valid number, not NaN or Infinity
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    const s = String(value).trim();
    if (!s || s === '-' || s === '--') return false;
    const up = s.toUpperCase();
    // REJECT: any string containing # (Excel errors), N/A, NA, NULL, NAN
    if (up.includes('#') || up.includes('N/A') || up.includes('NA') || 
        up.includes('NULL') || up.includes('NAN') || up.includes('ERROR')) {
      return false;
    }
    // Try to parse as number after removing % signs
    const cleaned = s.replace(/%/g, '').replace(/,/g, '.').trim();
    const num = parseFloat(cleaned);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

/**
 * Extract numeric REND value safely
 * Returns the number if valid, null otherwise
 */
export function extractRendValue(value: any): number | null {
  if (!isValidRend(value)) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    // Try to parse as percentage or number
    const cleaned = String(value).replace(/%/g, '').replace(/,/g, '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) || !isFinite(num) ? null : num;
  }
  return null;
}

/**
 * Robustly parse REND values (handles %, European commas, Excel errors)
 */
function parseRend(v: unknown): { valid: boolean; value: number | null; errorType?: string } {
  if (v === null || v === undefined || v === '') return { valid: false, value: null, errorType: 'empty' };
  const s = String(v).replace(/\u00A0/g, ' ').trim();
  if (!s) return { valid: false, value: null, errorType: 'empty' };
  
  const up = s.toUpperCase();
  
  // STRICT: Detect ANY error patterns
  if (up === 'N/A' || up === 'NA' || up.includes('N/A') || up.includes('NA')) return { valid: false, value: null, errorType: 'na' };
  if (up.includes('#')) {
    // Any # symbol indicates an Excel error: #DIV/0!, #N/A, #VALUE!, #REF!, #NAME?, #NUM!, etc.
    return { valid: false, value: null, errorType: 'error' };
  }
  if (up === 'NULL' || up.includes('NULL') || up === 'NAN' || up.includes('NAN') || up === '-' || up === '--') {
    return { valid: false, value: null, errorType: 'error' };
  }
  if (up === 'ERROR' || up.includes('ERROR')) {
    return { valid: false, value: null, errorType: 'error' };
  }

  let normalized = s
    .replace(/%/g, '')
    .replace(/[\u2212]/g, '-')
    .replace(/\s+/g, '')
    .replace(/'/g, '');
    
  if (!normalized) return { valid: false, value: null, errorType: 'empty' };

  // Handle European decimal comma
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = normalized.replace(/,/g, '.');
  }

  const n = parseFloat(normalized);
  if (isNaN(n) || !isFinite(n)) return { valid: false, value: null, errorType: 'error' };
  return { valid: true, value: n };
}

/**
 * Scans the first 80 rows to find the best header row and column mapping
 * More robust detection - accepts partial matches
 */
function findSchema(rows: (string | number | null)[][]) {
  const max = Math.min(rows.length, 80);
  let best: { headerRow: number; dateIdx: number; opIdx: number; rendIdx: number; score: number; allHeaders: string[] } | null = null;
  
  for (let r = 0; r < max; r++) {
    const row = rows[r] || [];
    let dateIdx = -1, opIdx = -1, rendIdx = -1;
    
    // Create a map of all headers in this row
    const headerMap: { [key: string]: number } = {};
    const allHeaders: string[] = [];
    for (let c = 0; c < row.length; c++) {
      const rawH = row[c];
      const h = normHeader(rawH);
      allHeaders.push(h);
      if (h && h.length > 0) {
        // Store original, don't overwrite if key already exists
        if (!headerMap[h]) headerMap[h] = c;
      }
    }
    
    // Look for Date - try ALL variations and fuzzy matching
    if (dateIdx === -1) {
      const dateVariants = ['date denroulage', 'date enroulage', 'date d enroulage', 'datedenroulage', 'datenroulage', 'date'];
      for (const variant of dateVariants) {
        if (headerMap[variant] !== undefined) {
          dateIdx = headerMap[variant];
          break;
        }
      }
      // Fuzzy match - contains 'date'
      if (dateIdx === -1) {
        for (let c = 0; c < allHeaders.length; c++) {
          const h = allHeaders[c];
          if (h.includes('date') && !h.includes('template') && h.length < 50) {
            dateIdx = c;
            break;
          }
        }
      }
    }
    
    // Look for Operator - try ALL variations and fuzzy matching
    if (opIdx === -1) {
      const opVariants = ['operateur', 'operator', 'operateur responsable', 'operatrice', 'operatrice'];
      for (const variant of opVariants) {
        if (headerMap[variant] !== undefined) {
          opIdx = headerMap[variant];
          break;
        }
      }
      // Fuzzy match - contains 'operateur' or 'operator'
      if (opIdx === -1) {
        for (let c = 0; c < allHeaders.length; c++) {
          const h = allHeaders[c];
          if ((h.includes('operateur') || h.includes('operator')) && h.length < 50) {
            opIdx = c;
            break;
          }
        }
      }
    }
    
    // Look for REND / Performance - try ALL variations and fuzzy matching
    if (rendIdx === -1) {
      const rendVariants = ['rend', 'rendement', 'rendement realise', 'rendement realise ml h', 'performance', 'rend%', 'rendementrealisemh', '%rendement'];
      for (const variant of rendVariants) {
        if (headerMap[variant] !== undefined) {
          rendIdx = headerMap[variant];
          break;
        }
      }
      // Fuzzy match - contains 'rend' or 'performance'
      if (rendIdx === -1) {
        for (let c = 0; c < allHeaders.length; c++) {
          const h = allHeaders[c];
          if ((h.includes('rend') || h.includes('performance') || h.includes('%')) && h.length < 50 && !h.includes('date')) {
            rendIdx = c;
            break;
          }
        }
      }
    }
    
    const score = (dateIdx !== -1 ? 1 : 0) + (opIdx !== -1 ? 1 : 0) + (rendIdx !== -1 ? 1 : 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { headerRow: r, dateIdx, opIdx, rendIdx, score, allHeaders };
    }
  }
  
  // More lenient scoring: require at least 2 columns, or even 1 if it's date + operator
  if (best && best.score >= 2) return best;
  if (best && best.dateIdx !== -1 && best.opIdx !== -1) return best; // Date + operator found
  if (best && best.dateIdx !== -1 && best.score >= 1) return best; // At least date is found
  return null;
}

export function parseFile(file: File): Promise<PerformanceRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'reporting') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null }) as (string | number | null)[][];

        if (rows.length === 0) {
          resolve([]);
          return;
        }

        const schema = findSchema(rows);
        if (!schema) {
          resolve([]);
          return;
        }

        const records: PerformanceRecord[] = [];
        const startRow = schema.headerRow + 1;

        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          let dateStr = '';
          const rawDate = row[schema.dateIdx];
          if (rawDate !== undefined && rawDate !== null) {
            if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\d+$/.test(rawDate))) {
              const numDate = Number(rawDate);
              if (numDate > 10000 && numDate < 60000) {
                 const dObj = XLSX.SSF.parse_date_code(numDate);
                 dateStr = dObj.d + '/' + dObj.m + '/' + dObj.y;
              } else {
                dateStr = String(rawDate).trim();
              }
            } else {
              dateStr = String(rawDate).trim();
            }
          }
          
          // Accept dates with minimum 8 characters (e.g., "01/01/24") or 10 characters ("01/01/2024")
          if (dateStr && dateStr.length < 8) {
            dateStr = ''; // Invalid date format
          }

          const operateur = String(row[schema.opIdx] || '').trim();
          const rendResult = schema.rendIdx !== -1 ? parseRend(row[schema.rendIdx]) : { valid: false, value: null };
          
          // Accept records with date + operator, even if REND is missing
          if (dateStr && operateur && dateStr.length > 5) {
            records.push({
              date: dateStr,
              operateur,
              rend: rendResult.value,
              design: '',
              designation: '',
              isValid: rendResult.valid,
              errorType: rendResult.errorType,
              rawRend: schema.rendIdx !== -1 ? String(row[schema.rendIdx] || '') : ''
            });
          }
        }
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Read failed'));
    reader.readAsBinaryString(file);
  });
}

export function aggregatePerformanceData(records: PerformanceRecord[]): AggregatedStats {
  const dailyStats = new Map<string, DailyOperatorStats>();
  const monthlyStats = new Map<string, { sum: number; count: number; records: number }>();
  const monthlyOperatorStats = new Map<string, { sum: number; count: number; records: number }>();
  let totalValidRend = 0, totalValidCount = 0;
  let totalEmpty = 0, totalNA = 0, totalError = 0;

  records.forEach((record) => {
    if (!record.date || !record.operateur) return;
    const key = record.date + '_' + record.operateur;
    const month = extractMonth(record.date);
    const monthOperatorKey = month + '_' + record.operateur;

    if (!dailyStats.has(key)) {
      dailyStats.set(key, { date: record.date, operateur: record.operateur, avgRend: 0, recordCount: 0, validCount: 0, invalidCount: 0, emptyCount: 0, naCount: 0, errorCount: 0 });
    }
    const daily = dailyStats.get(key)!;
    daily.recordCount += 1;

    // Use dynamic REND validation
    if (isValidRend(record.rend)) {
      const rendValue = extractRendValue(record.rend);
      if (rendValue !== null) {
        daily.validCount += 1;
        daily.avgRend += rendValue;
        totalValidRend += rendValue;
        totalValidCount += 1;
        if (!monthlyStats.has(month)) monthlyStats.set(month, { sum: 0, count: 0, records: 0 });
        const mStats = monthlyStats.get(month)!;
        mStats.sum += rendValue; mStats.count += 1; mStats.records += 1;
        
        // Add operator-level monthly stats
        if (!monthlyOperatorStats.has(monthOperatorKey)) monthlyOperatorStats.set(monthOperatorKey, { sum: 0, count: 0, records: 0 });
        const moStats = monthlyOperatorStats.get(monthOperatorKey)!;
        moStats.sum += rendValue; moStats.count += 1; moStats.records += 1;
      } else {
        daily.invalidCount += 1;
        if (!record.errorType || record.errorType === 'error') daily.errorCount = (daily.errorCount || 0) + 1;
        else if (record.errorType === 'empty') daily.emptyCount = (daily.emptyCount || 0) + 1;
        else if (record.errorType === 'na') daily.naCount = (daily.naCount || 0) + 1;
      }
    } else {
      daily.invalidCount += 1;
      const errorType = record.errorType || 'error';
      if (errorType === 'empty') { daily.emptyCount = (daily.emptyCount || 0) + 1; totalEmpty++; }
      else if (errorType === 'na') { daily.naCount = (daily.naCount || 0) + 1; totalNA++; }
      else { daily.errorCount = (daily.errorCount || 0) + 1; totalError++; }
    }
  });

  const byDay = Array.from(dailyStats.values()).map(s => ({ ...s, avgRend: (s.validCount > 0 ? s.avgRend / s.validCount : null) as number | null }));
  const byMonth = Array.from(monthlyOperatorStats.entries()).map(([key, s]) => {
    const [month, operateur] = key.split('_');
    return { month, operateur, avgRend: (s.count > 0 ? s.sum / s.count : null) as number | null, recordCount: s.records };
  });
  
  const totalRecords = records.length;
  const invalidCount = totalEmpty + totalNA + totalError;
  const purityPercentage = totalRecords > 0 ? ((totalValidCount / totalRecords) * 100) : 0;
  
  return {
    byDay: byDay.sort((a,b) => a.date.localeCompare(b.date)),
    byMonth: byMonth.sort((a,b) => a.month.localeCompare(b.month)),
    overall: { avgRend: totalValidCount > 0 ? (totalValidRend / totalValidCount) : null, totalRecords, validRecords: totalValidCount, invalidRecords: invalidCount, purity: purityPercentage },
    dataQuality: {
      validRecords: totalValidCount,
      emptyCount: totalEmpty,
      naCount: totalNA,
      errorCount: totalError,
      purityPercentage,
      invalidPercentage: 100 - purityPercentage
    }
  };
}

function extractMonth(d: string) {
  const p = d.split(/[/-]/);
  if (p.length === 3) {
    if (p[0].length === 4) return p[0] + '-' + p[1];
    let month = p[1], year = p[2];
    // Convert 2-digit year to 4-digit year
    const yearNum = parseInt(year);
    if (yearNum < 100) {
      year = String(2000 + yearNum);
    }
    return year + '-' + (month.length === 1 ? '0' + month : month);
  }
  return 'Unknown';
}

export function getMonthDisplay(m: string) {
  const [y, mm] = m.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return names[parseInt(mm)-1] + ' ' + y;
}

/**
 * 🔍 COMPREHENSIVE PRODUCTION DATA ANALYSIS
 * Analyzes all production metrics and handles missing data
 */
export function analyzeProductionData(records: ProductionRecord[]): ProductionStats {
  const stats: ProductionStats = {
    totalRecords: records.length,
    dateRange: null,
    totalPlanned: 0,
    totalProduced: 0,
    averageProduction: 0,
    planningAccuracy: 0,
    qualityBreakdown: {
      premierChoix: { quantity: 0, percentage: 0, avg: 0 },
      deuxiemeChoix: { quantity: 0, percentage: 0, avg: 0 },
      troisiemeChoix: { quantity: 0, percentage: 0, avg: 0 },
      waitingControl: { quantity: 0, percentage: 0, avg: 0 },
      cutMaterial: { quantity: 0, percentage: 0, avg: 0 },
      diversLocal: { quantity: 0, percentage: 0, avg: 0 }
    },
    qualityScore: 0,
    averageProductionTime: 0,
    averageSetupTime: 0,
    averageDelay: 0,
    timeEfficiency: 0,
    averageRendement: 0,
    averageTargetSpeed: 0,
    averageActualSpeed: 0,
    speedEfficiency: 0,
    totalWaste: 0,
    averageWaste: 0,
    wastePercentage: 0,
    topOperators: [],
    lowPerformers: [],
    missingDataFields: {},
    dataCompleteness: 0
  };

  if (records.length === 0) return stats;

  // Initialize counters
  let plannedCount = 0, producedCount = 0, producedSum = 0;
  let premierCount = 0, premierSum = 0;
  let deuxiemeCount = 0, deuxiemeSum = 0;
  let troisiemeCount = 0, troisiemeSum = 0;
  let waitCount = 0, waitSum = 0;
  let coupeCount = 0, coupeSum = 0;
  let diversCount = 0, diversSum = 0;
  let timeCount = 0, timeSum = 0;
  let setupCount = 0, setupSum = 0;
  let delayCount = 0, delaySum = 0;
  let rendCount = 0, rendSum = 0;
  let targetSpeedCount = 0, targetSpeedSum = 0;
  let actualSpeedCount = 0, actualSpeedSum = 0;
  let wasteCount = 0, wasteSum = 0;

  const operatorPerformance = new Map<string, { rend: number[]; quality: number; records: number }>();
  let minDate = '', maxDate = '';

  // Process records
  records.forEach((record) => {
    // Date range
    if (record.dateEnroulage) {
      if (!minDate) minDate = record.dateEnroulage;
      maxDate = record.dateEnroulage;
    }

    // Quantities
    if (record.qtePlanifie != null) {
      plannedCount++;
      stats.totalPlanned += record.qtePlanifie;
    }
    if (record.qteTotalEnroulee != null) {
      producedCount++;
      producedSum += record.qteTotalEnroulee;
      stats.totalProduced += record.qteTotalEnroulee;
    }

    // Quality breakdown
    if (record.qtePremierChoix != null) { premierCount++; premierSum += record.qtePremierChoix; }
    if (record.qteDeuxiemeChoix != null) { deuxiemeCount++; deuxiemeSum += record.qteDeuxiemeChoix; }
    if (record.qteTroisiemeChoix != null) { troisiemeCount++; troisiemeSum += record.qteTroisiemeChoix; }
    if (record.qteAttenteControle != null) { waitCount++; waitSum += record.qteAttenteControle; }
    if (record.qteCoupe != null) { coupeCount++; coupeSum += record.qteCoupe; }
    if (record.qteDiversLocal != null) { diversCount++; diversSum += record.qteDiversLocal; }

    // Time metrics
    if (record.tempsGlobal != null) { timeCount++; timeSum += record.tempsGlobal; }
    if (record.tempsReglage != null) { setupCount++; setupSum += record.tempsReglage; }
    if (record.heuresRetard != null) { delayCount++; delaySum += record.heuresRetard; }

    // KPIs
    if (record.pourcentageRendement != null) { rendCount++; rendSum += record.pourcentageRendement; }
    if (record.objectifMlPerH != null) { targetSpeedCount++; targetSpeedSum += record.objectifMlPerH; }
    if (record.rendementRealiseMlPerH != null) { actualSpeedCount++; actualSpeedSum += record.rendementRealiseMlPerH; }

    // Waste
    if (record.lisieresKg != null) { wasteCount++; wasteSum += record.lisieresKg; }

    // Operator performance
    if (record.operateur) {
      if (!operatorPerformance.has(record.operateur)) {
        operatorPerformance.set(record.operateur, { rend: [], quality: 0, records: 0 });
      }
      const opStats = operatorPerformance.get(record.operateur)!;
      opStats.records++;
      if (record.pourcentageRendement != null) opStats.rend.push(record.pourcentageRendement);
      if (record.qtePremierChoix != null && record.qteTotalEnroulee != null && record.qteTotalEnroulee > 0) {
        opStats.quality = (record.qtePremierChoix / record.qteTotalEnroulee) * 100;
      }
    }
  });

  // Calculate averages
  stats.dateRange = minDate ? { start: minDate, end: maxDate } : null;
  stats.averageProduction = producedCount > 0 ? producedSum / producedCount : 0;
  stats.planningAccuracy = plannedCount > 0 && producedCount > 0 ? (stats.totalProduced / stats.totalPlanned) * 100 : 0;

  // Quality breakdown
  stats.qualityBreakdown.premierChoix = { quantity: premierSum, percentage: producedSum > 0 ? (premierSum / producedSum) * 100 : 0, avg: premierCount > 0 ? premierSum / premierCount : 0 };
  stats.qualityBreakdown.deuxiemeChoix = { quantity: deuxiemeSum, percentage: producedSum > 0 ? (deuxiemeSum / producedSum) * 100 : 0, avg: deuxiemeCount > 0 ? deuxiemeSum / deuxiemeCount : 0 };
  stats.qualityBreakdown.troisiemeChoix = { quantity: troisiemeSum, percentage: producedSum > 0 ? (troisiemeSum / producedSum) * 100 : 0, avg: troisiemeCount > 0 ? troisiemeSum / troisiemeCount : 0 };
  stats.qualityBreakdown.waitingControl = { quantity: waitSum, percentage: producedSum > 0 ? (waitSum / producedSum) * 100 : 0, avg: waitCount > 0 ? waitSum / waitCount : 0 };
  stats.qualityBreakdown.cutMaterial = { quantity: coupeSum, percentage: producedSum > 0 ? (coupeSum / producedSum) * 100 : 0, avg: coupeCount > 0 ? coupeSum / coupeCount : 0 };
  stats.qualityBreakdown.diversLocal = { quantity: diversSum, percentage: producedSum > 0 ? (diversSum / producedSum) * 100 : 0, avg: diversCount > 0 ? diversSum / diversCount : 0 };
  stats.qualityScore = stats.qualityBreakdown.premierChoix.percentage;

  // Time metrics
  stats.averageProductionTime = timeCount > 0 ? timeSum / timeCount : 0;
  stats.averageSetupTime = setupCount > 0 ? setupSum / setupCount : 0;
  stats.averageDelay = delayCount > 0 ? delaySum / delayCount : 0;
  stats.timeEfficiency = timeCount > 0 && setupCount > 0 ? ((timeSum - setupSum) / timeSum) * 100 : 0;

  // KPIs
  stats.averageRendement = rendCount > 0 ? rendSum / rendCount : 0;
  stats.averageTargetSpeed = targetSpeedCount > 0 ? targetSpeedSum / targetSpeedCount : 0;
  stats.averageActualSpeed = actualSpeedCount > 0 ? actualSpeedSum / actualSpeedCount : 0;
  stats.speedEfficiency = stats.averageTargetSpeed > 0 ? (stats.averageActualSpeed / stats.averageTargetSpeed) * 100 : 0;

  // Waste
  stats.totalWaste = wasteSum;
  stats.averageWaste = wasteCount > 0 ? wasteSum / wasteCount : 0;
  stats.wastePercentage = producedSum > 0 ? (wasteSum / producedSum) * 100 : 0;

  // Operator performance
  const operatorsList = Array.from(operatorPerformance.entries()).map(([name, data]) => ({
    name,
    avgRendement: data.rend.length > 0 ? data.rend.reduce((a, b) => a + b) / data.rend.length : 0,
    records: data.records,
    quality: data.quality
  }));
  stats.topOperators = operatorsList.sort((a, b) => b.avgRendement - a.avgRendement).slice(0, 3);
  stats.lowPerformers = operatorsList.sort((a, b) => a.avgRendement - b.avgRendement).slice(0, 3);

  // Data quality - missing fields
  const fieldsToCheck: (keyof ProductionRecord)[] = [
    'dateEnroulage', 'client', 'orderRef', 'qteTotalEnroulee', 'qtePremierChoix',
    'tempsGlobal', 'operateur', 'pourcentageRendement', 'lisieresKg'
  ];
  fieldsToCheck.forEach(field => {
    const missing = records.filter(r => r[field] == null || r[field] === '').length;
    if (missing > 0) stats.missingDataFields[String(field)] = missing;
  });
  stats.dataCompleteness = records.length > 0 ? 100 - ((Object.values(stats.missingDataFields).reduce((a, b) => a + b, 0) / (records.length * fieldsToCheck.length)) * 100) : 100;

  return stats;
}

