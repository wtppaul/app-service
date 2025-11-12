-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COURSE_LIKE', 'COURSE_REVIEW', 'NEW_ENROLLMENT', 'NEW_FOLLOWER', 'COURSE_PUBLISHED', 'COURSE_APPROVED', 'COURSE_REJECTED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SYSTEM_ANNOUNCEMENT', 'TEACHER_VERIFIED', 'ACHIEVEMENT_UNLOCKED', 'COMMENT_REPLY', 'MENTION', 'WISHLIST_REMINDER', 'COURSE_UPDATE', 'CERTIFICATE_READY', 'SUPPORT_REPLY', 'AFFILIATE_EARNINGS', 'BADGE_EARNED');

-- CreateEnum
CREATE TYPE "NotificationUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "relatedId" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'COURSE_LIKE',
ADD COLUMN     "urgency" "NotificationUrgency" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "Notification_authId_idx" ON "Notification"("authId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
