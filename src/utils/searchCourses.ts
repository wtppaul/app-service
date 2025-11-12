import { prisma } from './prisma';

interface SearchCourseOptions {
  query: string;
  limit?: number;
  offset?: number;
}

export async function searchCourses({
  query,
  limit = 10,
  offset = 0,
}: SearchCourseOptions) {
  return await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      "Course".*,
      ts_rank("Course"."searchVector", plainto_tsquery('simple', $1)) AS "rank",
      (
        SELECT COUNT(*) FROM "Enrollment"
        WHERE "Enrollment"."courseId" = "Course"."id"
      ) AS "enrolledCount"
    FROM "Course"
    WHERE "Course"."searchVector" @@ plainto_tsquery('simple', $1)
    ORDER BY "rank" DESC, "enrolledCount" DESC
    LIMIT $2 OFFSET $3
  `,
    query,
    limit,
    offset
  );
}
