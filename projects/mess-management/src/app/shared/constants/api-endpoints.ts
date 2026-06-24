export const API_ENDPOINTS = {
  HEALTH: '/health',
  TAP: '/tap',
  TAPS: '/taps',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ID: (id: string | number) => `/students/${id}`,
  STUDENT_RENEW: (id: string | number) => `/students/${id}/renew`,
  STUDENT_PAUSE: (id: string | number) => `/students/${id}/pause`,
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

  // Settings
  SETTINGS: '/settings',

  // Hardware
  HARDWARE_STATUS: '/hardware-status',

  // Display Config
  DISPLAY_CONFIG: '/display-config',
  DISPLAY_CONFIG_BY_MEAL: (meal: string) => `/display-config/${meal}`
};
