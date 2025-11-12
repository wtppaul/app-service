import { CourseQueryParams } from '../config/types/course';

export function isSafePublicCourseQuery(query: CourseQueryParams): boolean {
  const allowedKeys = ['status', 'level'];
  const queryKeys = Object.keys(query);

  // Jika tidak ada query → BUKAN public
  if (queryKeys.length === 0) return false;

  // Jika ada key yang tidak diizinkan → BUKAN public
  const allKeysAllowed = queryKeys.every((key) => allowedKeys.includes(key));
  if (!allKeysAllowed) return false;

  // Jika status disertakan, harus PUBLISHED
  if (query.status && query.status !== 'PUBLISHED') return false;

  return true;
}
