// Matches utils/seed.js exactly: 1 admin, 3 hospitals, 5 vendors, fixed
// passwords per role. Demo/dev convenience only.

export const ADMIN_ACCOUNT = { label: 'Admin', email: 'admin@pss04.gov.in', password: 'admin123' }

export const HOSPITAL_ACCOUNTS = [
  { label: 'Schultzshire District', email: 'hospital1@pss04.gov.in', password: 'hospital123' },
  { label: 'Cortneyton District', email: 'hospital2@pss04.gov.in', password: 'hospital123' },
  { label: 'Beerworth District', email: 'hospital3@pss04.gov.in', password: 'hospital123' },
]

export const VENDOR_ACCOUNTS = [
  { label: 'Littel - Roob', email: 'vendor1@pss04.gov.in', password: 'vendor123' },
  { label: 'Rau - McGlynn', email: 'vendor2@pss04.gov.in', password: 'vendor123' },
  { label: 'Mueller, Hickle and Thiel', email: 'vendor3@pss04.gov.in', password: 'vendor123' },
  { label: 'Nienow - Zieme', email: 'vendor4@pss04.gov.in', password: 'vendor123' },
  { label: 'Tillman, Grant and Koch', email: 'vendor5@pss04.gov.in', password: 'vendor123' },
]
