export const API_ENDPOINTS = {
  HEALTH: '/health',
  TAP: '/tap',
  TAPS: '/taps',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ID: (id: string | number) => `/students/${id}`,
  STUDENT_RENEW: (id: string | number) => `/students/${id}/renew`,
  STUDENTS_EXPIRING: '/students/expiring',

  // RFID
  RFID: '/rfid',
  RFID_DEACTIVATE: (roll_number: string) => `/rfid/${roll_number}/deactivate`,
  RFID_REASSIGN: (roll_number: string) => `/rfid/${roll_number}/reassign`,
  RFID_HISTORY: (roll_number: string) => `/rfid/${roll_number}/history`,
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
  SETTINGS: '/settings',

  // Hardware
  HARDWARE_STATUS: '/hardware-status'
};
