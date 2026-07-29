export const API_ENDPOINTS = {
  HEALTH: '/health',
  TAP: '/tap',
  TAPS: '/taps',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ADMISSION_NUMBER: (admissionNumber: string) => `/students/${admissionNumber}`,
  STUDENT_LOOKUP: (admissionNumber: string) => `/students/lookup/${admissionNumber}`,
  STUDENT_RENEW: (admissionNumber: string) => `/students/${admissionNumber}/renew`,
  STUDENT_PAUSE: (admissionNumber: string) => `/students/${admissionNumber}/pause`,
  STUDENTS_EXPIRING: '/students/expiring',

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
  REPORTS_PAUSE_AUDIT: '/reports/pause-audit',
  REPORTS_ANOMALIES: '/reports/anomalies',
  REPORTS_ANALYTICS: '/reports/analytics',

  // Reports — Per-student
  STUDENT_TAPS: (admissionNumber: string) => `/students/${admissionNumber}/taps`,
  STUDENT_ATTENDANCE: (admissionNumber: string) => `/students/${admissionNumber}/attendance`,
  STUDENT_CHANGELOG: (admissionNumber: string) => `/students/${admissionNumber}/changelog`,
  STUDENT_PAUSE_COMP: (admissionNumber: string) => `/students/${admissionNumber}/pause-comp`,
  STUDENT_SUBSCRIPTION_HISTORY: (admissionNumber: string) => `/students/${admissionNumber}/subscription-history`,

  // Reports — Changelog
  CHANGELOG: '/changelog',

  // Reports — Holidays
  HOLIDAYS_LIST: '/schedule/holidays',
  HOLIDAY_BY_ID: (id: string) => `/schedule/holiday/${id}`,

  // Hardware
  HARDWARE_STATUS: '/hardware-status',
  HARDWARE: '/hardware',
  HARDWARE_CONNECT: '/hardware/connect',
  HARDWARE_BY_ID: (id: string) => `/hardware/${id}`,
  HARDWARE_START_PAIRING: '/hardware/start-pairing',
  HARDWARE_PAIR: '/hardware/pair',
  HARDWARE_CONFIRM: (id: string) => `/hardware/${id}/confirm`,
  HARDWARE_ROTATE_SECRET: (id: string) => `/hardware/${id}/rotate-secret`,
  HARDWARE_HEARTBEAT: '/hardware/heartbeat',

  // Display Config
  DISPLAY_CONFIG: '/display-config',
  DISPLAY_CONFIG_BY_MEAL: (meal: string) => `/display-config/${meal}`,

  // Bulk Upload
  STUDENTS_BULK_UPLOAD: '/students/bulk-upload'
};
