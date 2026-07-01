export const API_ENDPOINTS = {
  HEALTH: '/health',
  TAP: '/tap',
  TAPS: '/taps',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ROLL_NUMBER: (rollNumber: string) => `/students/${rollNumber}`,
  STUDENT_LOOKUP: (rollNumber: string) => `/students/lookup/${rollNumber}`,
  STUDENT_RENEW: (rollNumber: string) => `/students/${rollNumber}/renew`,
  STUDENT_PAUSE: (rollNumber: string) => `/students/${rollNumber}/pause`,
  STUDENT_BLOCK: (rollNumber: string) => `/students/${rollNumber}/block`,
  STUDENT_UNBLOCK: (rollNumber: string) => `/students/${rollNumber}/unblock`,
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
  STUDENT_TAPS: (rollNumber: string) => `/students/${rollNumber}/taps`,
  STUDENT_ATTENDANCE: (rollNumber: string) => `/students/${rollNumber}/attendance`,
  STUDENT_CHANGELOG: (rollNumber: string) => `/students/${rollNumber}/changelog`,
  STUDENT_PAUSE_COMP: (rollNumber: string) => `/students/${rollNumber}/pause-comp`,
  STUDENT_SUBSCRIPTION_HISTORY: (rollNumber: string) => `/students/${rollNumber}/subscription-history`,

  // Reports — Changelog
  CHANGELOG: '/changelog',

  // Reports — Holidays
  HOLIDAYS_LIST: '/schedule/holidays',
  HOLIDAY_BY_ID: (id: string) => `/schedule/holiday/${id}`,

  // Settings
  SETTINGS: '/settings',

  // Hardware
  HARDWARE_STATUS: '/hardware-status',
  HARDWARE: '/hardware',
  HARDWARE_BY_ID: (id: string) => `/hardware/${id}`,
  HARDWARE_START_PAIRING: '/hardware/start-pairing',
  HARDWARE_PAIR: '/hardware/pair',
  HARDWARE_CONFIRM: (id: string) => `/hardware/${id}/confirm`,
  HARDWARE_TEST_PRINTER: (id: string) => `/hardware/${id}/test-printer`,
  HARDWARE_TEST_DISPLAY: (id: string) => `/hardware/${id}/test-display`,
  HARDWARE_ROTATE_SECRET: (id: string) => `/hardware/${id}/rotate-secret`,
  HARDWARE_HEARTBEAT: (id: string) => `/hardware/${id}/heartbeat`,
  HARDWARE_STOP: (id: string) => `/hardware/${id}/stop`,

  // Display Config
  DISPLAY_CONFIG: '/display-config',
  DISPLAY_CONFIG_BY_MEAL: (meal: string) => `/display-config/${meal}`
};
