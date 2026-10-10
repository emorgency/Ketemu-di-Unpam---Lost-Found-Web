// RBAC matrix (AGENTS.md §2.3, ARCHITECTURE.md §8)
// Otorisasi final di Supabase RLS; file ini untuk guard di aplikasi + audit.

export const ROLES = ['USER', 'LOST_FOUND_OFFICER', 'ADMIN']

export function isOfficer(role) {
  return role === 'LOST_FOUND_OFFICER' || role === 'ADMIN'
}
export function isAdmin(role) {
  return role === 'ADMIN'
}

// Aksi operasional
export const PERMISSIONS = {
  USER: ['create_report', 'own_reports', 'search_items', 'submit_claim', 'own_claims', 'notifications'],
  LOST_FOUND_OFFICER: [
    'create_report', 'own_reports', 'search_items', 'submit_claim', 'own_claims', 'notifications',
    'view_all_reports', 'validate_report', 'receive_item', 'match_items', 'verify_claim', 'record_pickup',
    'view_audit',
  ],
  ADMIN: [
    'create_report', 'own_reports', 'search_items', 'submit_claim', 'own_claims', 'notifications',
    'view_all_reports', 'validate_report', 'receive_item', 'match_items', 'verify_claim', 'record_pickup',
    'view_audit', 'manage_users', 'manage_categories',
  ],
}

export function can(role, action) {
  return (PERMISSIONS[role] || []).includes(action)
}

export function requireRole(role, action) {
  if (!can(role, action)) {
    const err = new Error(`Akses ditolak untuk aksi ${action}`)
    err.code = 'FORBIDDEN'
    throw err
  }
}
