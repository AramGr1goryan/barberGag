export type DateRangeType =
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "month"
  | "last_month"
  | "year"
  | "custom";

export type MetricType = "revenue" | "completed" | "atv" | "cancellations";

export interface KPICardData {
  value: number;
  previousValue: number;
  percentChange: number;
  direction: "up" | "down" | "neutral";
  hasPreviousData: boolean;
}

export interface SummaryKPIs {
  todayRevenue: KPICardData;
  yesterdayRevenue: KPICardData;
  weekRevenue: KPICardData;
  monthRevenue: KPICardData;
  todayCompletedCount: KPICardData;
  todayCancelledCount: KPICardData;
  averageTransactionValue: KPICardData;
  expectedRevenueTomorrow: {
    expected: number;
    confirmedBookedRevenue: number;
    estimatedAdditional: number;
    confidence: number;
    expectedCompletedAppointments: number;
    expectedCancellations: number;
    dataSufficiency: "LIMITED" | "BASIC" | "MODERATE" | "STRONG";
  };
}

export interface DailyTrendPoint {
  date: string;
  dayLabel: string;
  realizedRevenue: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageTransactionValue: number;
  isForecast?: boolean;
  forecastLow?: number;
  forecastHigh?: number;
}

export interface TomorrowForecast {
  targetDate: string;
  confirmedBookingsCount: number;
  confirmedBookedRevenue: number;
  expectedCompletedAppointments: number;
  expectedCancellations: number;
  expectedCancellationRevenue: number;
  expectedTotalRevenue: number;
  predictionRange: {
    low: number;
    expected: number;
    high: number;
  };
  confidencePercent: number;
  dataSufficiencyTier: "LIMITED" | "BASIC" | "MODERATE" | "STRONG";
  historicalCompletionRate: number;
  historicalCancellationRate: number;
  availableSlotsCount: number;
  potentialAdditionalRevenue: number;
}

export interface DayForecastItem {
  date: string;
  weekday: string;
  alreadyBookedCount: number;
  alreadyBookedRevenue: number;
  expectedCompleted: number;
  expectedCancellations: number;
  expectedRevenue: number;
  confidence: number;
}

export interface MonthEndForecast {
  currentMonth: string;
  revenueSoFar: number;
  expectedRemainingDaysRevenue: number;
  forecastMonthEndRevenue: number;
  previousMonthRevenue: number;
  forecastChangePercent: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  remainingDays: number;
  confidence: number;
}

export interface CancellationBreakdown {
  totalCancelled: number;
  cancellationRate: number;
  potentialLostRevenue: number;
  weekdayCancellationRates: {
    dayIndex: number;
    dayName: string;
    cancelledCount: number;
    totalCount: number;
    ratePercent: number;
  }[];
  hourlyCancellationRates: {
    hourSlot: string;
    cancelledCount: number;
    totalCount: number;
    ratePercent: number;
  }[];
}

export interface ServiceFinancialItem {
  serviceId: string;
  serviceName: string;
  completedBookingsCount: number;
  realizedRevenue: number;
  averagePrice: number;
  revenueSharePercent: number;
  cancellationCount: number;
  cancellationRate: number;
}

export interface CustomerAnalyticsSummary {
  totalUniqueCustomers: number;
  newCustomersCount: number;
  returningCustomersCount: number;
  repeatBookingRatePercent: number;
  averageCustomerLifetimeValue: number;
  topCustomers: {
    phoneMasked: string;
    guestName: string;
    completedBookingsCount: number;
    totalRealizedRevenue: number;
    lastAppointmentDate: string;
  }[];
}

export interface WeekdayPerformance {
  dayIndex: number;
  dayName: string;
  totalRealizedRevenue: number;
  completedAppointmentsCount: number;
  averageRevenuePerDay: number;
  sharePercent: number;
}

export interface TimeSlotPerformance {
  timeBand: string; // e.g. "09:00 - 12:00"
  realizedRevenue: number;
  completedCount: number;
  averageTransactionValue: number;
  cancellationRatePercent: number;
}

export interface ScheduleUtilizationMetrics {
  totalOpenSlots: number;
  bookedSlots: number;
  completedSlots: number;
  cancelledSlots: number;
  bookingUtilizationPercent: number;
  completedUtilizationPercent: number;
  tomorrowOpenSlots: number;
  tomorrowPotentialRevenue: number;
}

export interface BusinessInsightItem {
  id: string;
  type: "positive" | "warning" | "opportunity" | "info";
  title: string;
  description: string;
  metricValue?: string | number;
}

export interface FullFinancialAnalyticsResponse {
  currency: string;
  timezone: string;
  dataSufficiency: "LIMITED" | "BASIC" | "MODERATE" | "STRONG";
  totalCompletedRecordsInDatabase: number;
  kpis: SummaryKPIs;
  trend: {
    rangeType: DateRangeType;
    startDate: string;
    endDate: string;
    points: DailyTrendPoint[];
    overallRealizedRevenue: number;
    overallCompletedCount: number;
    overallCancelledCount: number;
    overallPotentialLostRevenue: number;
    growthVsPreviousPeriodPercent: number;
  };
  tomorrowForecast: TomorrowForecast;
  sevenDayForecast: DayForecastItem[];
  monthEndForecast: MonthEndForecast;
  cancellations: CancellationBreakdown;
  services: {
    items: ServiceFinancialItem[];
    topRevenueService: string | null;
    mostBookedService: string | null;
    highestCancellationService: string | null;
  };
  customers: CustomerAnalyticsSummary;
  weekdayPerformance: WeekdayPerformance[];
  timeSlotPerformance: TimeSlotPerformance[];
  utilization: ScheduleUtilizationMetrics;
  insights: BusinessInsightItem[];
}
