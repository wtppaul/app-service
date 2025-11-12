-- CreateTable
CREATE TABLE "CourseLove" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "studentId" TEXT,

    CONSTRAINT "CourseLove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLove" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT,
    "studentId" TEXT,
    "lovedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLove_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseLove_teacherId_studentId_courseId_key" ON "CourseLove"("teacherId", "studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLove_teacherId_studentId_lovedUserId_key" ON "UserLove"("teacherId", "studentId", "lovedUserId");

-- AddForeignKey
ALTER TABLE "CourseLove" ADD CONSTRAINT "CourseLove_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLove" ADD CONSTRAINT "CourseLove_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLove" ADD CONSTRAINT "CourseLove_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLove" ADD CONSTRAINT "UserLove_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLove" ADD CONSTRAINT "UserLove_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
