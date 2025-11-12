
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  teacherId: 'teacherId',
  slug: 'slug',
  level: 'level',
  status: 'status',
  hashtags: 'hashtags',
  isFree: 'isFree',
  license: 'license'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  authId: 'authId',
  name: 'name',
  bio: 'bio',
  username: 'username'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  parentId: 'parentId',
  description: 'description',
  slug: 'slug'
};

exports.Prisma.ChapterScalarFieldEnum = {
  id: 'id',
  title: 'title',
  order: 'order',
  courseId: 'courseId',
  slug: 'slug'
};

exports.Prisma.LessonScalarFieldEnum = {
  id: 'id',
  title: 'title',
  order: 'order',
  chapterId: 'chapterId',
  duration: 'duration',
  playbackId: 'playbackId',
  isPreview: 'isPreview'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  studentId: 'studentId',
  rating: 'rating',
  comment: 'comment'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  authId: 'authId',
  name: 'name',
  username: 'username'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug'
};

exports.Prisma.EnrollmentScalarFieldEnum = {
  id: 'id',
  authId: 'authId',
  userRole: 'userRole',
  courseId: 'courseId',
  createdAt: 'createdAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  authId: 'authId'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  courseId: 'courseId',
  addedAt: 'addedAt'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  midtransOrderId: 'midtransOrderId',
  status: 'status',
  totalAmount: 'totalAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  cartId: 'cartId',
  authId: 'authId'
};

exports.Prisma.WishlistScalarFieldEnum = {
  id: 'id',
  authId: 'authId',
  userRole: 'userRole',
  courseId: 'courseId',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  authId: 'authId',
  message: 'message',
  isRead: 'isRead',
  createdAt: 'createdAt',
  type: 'type',
  courseId: 'courseId',
  actorId: 'actorId',
  relatedId: 'relatedId',
  urgency: 'urgency'
};

exports.Prisma.CourseLoveScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  courseId: 'courseId',
  teacherId: 'teacherId',
  studentId: 'studentId',
  authId: 'authId',
  userRole: 'userRole'
};

exports.Prisma.UserLoveScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  authId: 'authId',
  userRole: 'userRole',
  lovedUserId: 'lovedUserId',
  teacherId: 'teacherId',
  studentId: 'studentId',
  lovedTeacherId: 'lovedTeacherId',
  lovedStudentId: 'lovedStudentId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.CourseLevel = exports.$Enums.CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

exports.CourseStatus = exports.$Enums.CourseStatus = {
  DRAFT: 'DRAFT',
  INCOMPLETE: 'INCOMPLETE',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FOLLOWED_UP: 'FOLLOWED_UP',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  UNPUBLISHED: 'UNPUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

exports.CourseLicense = exports.$Enums.CourseLicense = {
  EE: 'EE',
  ET: 'ET',
  NT: 'NT'
};

exports.Role = exports.$Enums.Role = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  COURSE_LIKE: 'COURSE_LIKE',
  COURSE_REVIEW: 'COURSE_REVIEW',
  NEW_ENROLLMENT: 'NEW_ENROLLMENT',
  NEW_FOLLOWER: 'NEW_FOLLOWER',
  COURSE_PUBLISHED: 'COURSE_PUBLISHED',
  COURSE_APPROVED: 'COURSE_APPROVED',
  COURSE_REJECTED: 'COURSE_REJECTED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
  TEACHER_VERIFIED: 'TEACHER_VERIFIED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  COMMENT_REPLY: 'COMMENT_REPLY',
  MENTION: 'MENTION',
  WISHLIST_REMINDER: 'WISHLIST_REMINDER',
  COURSE_UPDATE: 'COURSE_UPDATE',
  CERTIFICATE_READY: 'CERTIFICATE_READY',
  SUPPORT_REPLY: 'SUPPORT_REPLY',
  AFFILIATE_EARNINGS: 'AFFILIATE_EARNINGS',
  BADGE_EARNED: 'BADGE_EARNED'
};

exports.NotificationUrgency = exports.$Enums.NotificationUrgency = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.Prisma.ModelName = {
  Course: 'Course',
  Teacher: 'Teacher',
  Category: 'Category',
  Chapter: 'Chapter',
  Lesson: 'Lesson',
  Review: 'Review',
  Student: 'Student',
  Tag: 'Tag',
  Enrollment: 'Enrollment',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Transaction: 'Transaction',
  Wishlist: 'Wishlist',
  Notification: 'Notification',
  CourseLove: 'CourseLove',
  UserLove: 'UserLove'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
