export const API_ENDPOINTS = {
  HEALTH: '/health',
  TAP: '/tap',
  TAPS: '/taps',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/customers/${id}`,
  CUSTOMER_RENEW: (id: string | number) => `/customers/${id}/renew`,
  CUSTOMERS_EXPIRING: '/customers/expiring',

  // RFID
  RFID: '/rfid',
  RFID_DEACTIVATE: (uid: string) => `/rfid/${uid}/deactivate`,
  RFID_REASSIGN: (uid: string) => `/rfid/${uid}/reassign`,
  RFID_HISTORY: (uid: string) => `/rfid/${uid}/history`,
  RFID_BULK: '/rfid/bulk',

  // Schedule
  SCHEDULE: '/schedule',
  SCHEDULE_TODAY: '/schedule/today',
  SCHEDULE_BY_ID: (id: string | number) => `/schedule/${id}`,
  SCHEDULE_HOLIDAY: '/schedule/holiday',

  // Reports
  REPORTS_TODAY: '/reports/today',
  REPORTS_EXPORTS: '/reports/exports',
  REPORTS_EXPORT_BY_DATE: (date: string) => `/reports/exports/${date}`,
  REPORTS_EXPORT_TRIGGER: '/reports/export/trigger',
  REPORTS_RANGE: '/reports/range',

  // Settings
  SETTINGS: '/settings'
};
