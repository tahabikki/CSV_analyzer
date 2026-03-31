export interface ProductionRecord {
  // 🧾 Order & Product Information
  dateEnroulage?: string;
  client?: string;
  clients?: string;
  orderRef?: string;
  famille?: string;
  codePF?: string;
  designation?: string;

  // 📦 Quantities & Production
  qteNetCde?: number;
  qtePlanifie?: number;
  qteTotalEnroulee?: number;

  // 🏭 Quality Breakdown (Production Output)
  qtePremierChoix?: number;
  qteMLPremierChoix?: number;
  qteAttenteControle?: number;
  attenteControle?: number;
  qteCoupe?: number;
  qteMLCoupe?: number;
  qteDiversLocal?: number;
  qteMLDivers?: number;
  qteDeuxiemeChoix?: number;
  qteMLDeuxiemeChoix?: number;
  qteTroisiemeChoix?: number;
  qteMLTroisiemeChoix?: number;

  // ♻️ Waste & Side Production
  lisieresKg?: number;
  collageML?: number;

  // ⏱️ Time & Performance Tracking
  heuresRetard?: number;
  tempsGlobal?: number;
  tempsParArticles?: number;
  tempsOuverture?: number;
  heureOuverture?: number;
  tempsReglage?: number;
  tempsRealisee?: number;

  // 👷 Human & Machine Resources
  machine?: string;
  operateur?: string;
  chefEquipe?: string;

  // 🧠 Analysis & Classification
  observation?: string;
  declasse?: string;
  semaine?: number;
  mois?: number;
  epaisseur?: string;
  concatenationFamille?: string;
  articlesPapier?: string;

  // 🎯 Targets & Efficiency (KPIs)
  objectif?: number;
  objectifMlPerH?: number;
  objectifMLH?: number;
  rendementRealiseMlPerH?: number;
  rendementRealiseMlh?: number;
  pourcentageRendement?: number;

  // 📈 Additional Metrics
  colonne1?: string | number;
  colonne2?: string | number;
  colonne3?: string | number;
  obj?: number;
  rend?: number | null;
  date?: string;
  design?: string;

  // Metadata
  isValid: boolean;
  errorType?: string;
  rawData?: Record<string, any>;
}

export interface ProductionStats {
  // 📊 Overall Metrics
  totalRecords: number;
  dateRange: { start: string; end: string } | null;
  
  // 📦 Quantity Statistics
  totalPlanned: number;
  totalProduced: number;
  averageProduction: number;
  planningAccuracy: number; // %
  
  // 🏭 Quality Analysis
  qualityBreakdown: {
    premierChoix: { quantity: number; percentage: number; avg: number };
    deuxiemeChoix: { quantity: number; percentage: number; avg: number };
    troisiemeChoix: { quantity: number; percentage: number; avg: number };
    waitingControl: { quantity: number; percentage: number; avg: number };
    cutMaterial: { quantity: number; percentage: number; avg: number };
    diversLocal: { quantity: number; percentage: number; avg: number };
  };
  qualityScore: number; // Based on first choice %
  
  // ⏱️ Time Performance
  averageProductionTime: number;
  averageSetupTime: number;
  averageDelay: number;
  timeEfficiency: number; // %
  
  // 🚀 Efficiency KPIs
  averageRendement: number;
  averageTargetSpeed: number;
  averageActualSpeed: number;
  speedEfficiency: number; // actual/target %
  
  // ♻️ Waste Analysis
  totalWaste: number;
  averageWaste: number;
  wastePercentage: number;
  
  // 👥 Operator Performance (top 3)
  topOperators: Array<{ name: string; avgRendement: number; records: number; quality: number }>;
  lowPerformers: Array<{ name: string; avgRendement: number; records: number; quality: number }>;

// 🔍 Data Quality
  missingDataFields: { [key: string]: number }; // Field name -> count of missing
  dataCompleteness: number; // Overall %
}

export interface PerformanceRecord extends ProductionRecord {
  date?: string;
  design?: string;
  rawRend?: string;
}

export interface DailyOperatorStats {
  date: string;
  operateur: string;
  avgRend: number | null;
  recordCount: number;
  validCount: number;
  invalidCount: number;
  emptyCount?: number;
  naCount?: number;
  errorCount?: number;
}

export interface MonthlyStats {
  month: string;
  operateur?: string;
  avgRend: number | null;
  recordCount: number;
  validWeight?: number;
}

export interface QualityMetrics {
  premierChoixQte: number;
  deuxiemeChoixQte: number;
  troisiemeChoixQte: number;
  diversLocalQte: number;
  totalProduced: number;
  qualityPercentage: number;
  defectRate: number;
}

export interface ProductionSummary {
  totalProduced: number;
  qualityBreakdown: QualityMetrics;
  averageEfficiency: number;
  wasteTotal: number;
  topOperators: Array<{ operateur: string; avgRend: number; recordCount: number }>;
  topMachines: Array<{ machine: string; avgRend: number; recordCount: number }>;
  topFamilies: Array<{ famille: string; totalQte: number; avgRend: number }>;
}

export interface DataQualityMetrics {
  validRecords: number;
  emptyCount: number;
  naCount: number;
  errorCount: number;
  purityPercentage: number;
  invalidPercentage: number;
}

export interface AggregatedStats {
  byDay: DailyOperatorStats[];
  byMonth: MonthlyStats[];
  overall: {
    avgRend: number | null;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    purity: number;
  };
  productionSummary?: ProductionSummary;
  dataQuality?: DataQualityMetrics;
}
