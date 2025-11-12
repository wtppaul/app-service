// Role-Based Access Control (RBAC)
const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  MODERATOR: 'moderator',
  MARKETER: 'marketer',
};

const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_courses',
    'view_reports',
    'change_roles',
  ],
  [ROLES.INSTRUCTOR]: ['create_courses', 'edit_courses', 'view_analytics'],
  [ROLES.STUDENT]: [
    'buy_courses',
    'access_courses',
    'upload_projects',
    'give_reviews',
  ],
  [ROLES.MODERATOR]: ['verify_content', 'moderate_reviews'],
  [ROLES.MARKETER]: ['manage_affiliates', 'track_sales'],
};

module.exports = { ROLES, PERMISSIONS };
