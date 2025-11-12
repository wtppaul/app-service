// src/constants/courseStatus.ts
export const statusDescriptions = {
  DRAFT: 'Course just created. No content yet.',
  INCOMPLETE: 'Awaiting submission. Please complete and submit for review.',
  PENDING_REVIEW: 'Submitted and waiting for admin review.',
  FOLLOWED_UP: 'Admin sent feedback. Please respond.',
  APPROVED: 'Approved by admin. Waiting to be published.',
  PUBLISHED: 'Published and publicly visible.',
  REJECTED: 'Rejected by admin. See feedback.',
  UNPUBLISHED: 'Temporarily removed from public view.',
  ARCHIVED: 'Deprecated course. No longer maintained.',
} as const satisfies Record<string, string>;

export type CourseStatus = keyof typeof statusDescriptions;
