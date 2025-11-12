-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
CREATE INDEX idx_course_slug_teacher ON "Course" ("slug", "teacherId");