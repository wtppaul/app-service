import { prisma } from './prisma';
import { verifyToken } from './jwt';
import { Role } from '../../generated/prisma'; // Impor tipe Role jika ada

// ⛔️ HAPUS: 'verifyToken' tidak diperlukan di file utility ini
// import { verifyToken } from './jwt';

/**
 * (Logika "Smart BFF")
 * Fungsi ini menggunakan koneksi Prisma (read-only) milik BFF
 * untuk memvalidasi apakah seorang user (berdasarkan AuthID)
 * adalah pemilik dari sebuah Course (berdasarkan CourseID).
 *
 * Ini adalah TANGGUNG JAWAB BFF sebelum memanggil
 * service "bodoh" (Go) untuk melakukan 'Update' atau 'Delete'.
 */
export const validateCourseOwnership = async (
  authId: string,
  courseId: string,
  role: string
) => {
  // 1. Admin selalu bisa akses
  if (role === 'admin') return true;

  // 2. Jika bukan admin, harus teacher
  if (role !== 'teacher') return false;

  // 3. Ambil "Profil" Teacher berdasarkan "Paspor" (AuthID)
  const teacher = await prisma.teacher.findUnique({
    where: { authId }, // cari teacher berdasarkan authId dari token
  });

  if (!teacher) return false; // User ini bukan teacher

  // 4. Ambil kursus untuk dicek kepemilikannya
  // (Prisma client cukup pintar menangani konversi string 'courseId' ke UUID)
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false; // Kursus tidak ditemukan

  // 5. Validasi kepemilikan
  return course.teacherId === teacher.id;
};


/**
 * ✅ --- FUNGSI BARU ---
 * Memvalidasi apakah user adalah pemilik CHAPTER (melalui course)
 */
export const validateChapterOwnership = async (
  authId: string,
  chapterId: string,
  role: Role | string
) => {
  // Admin selalu bisa akses
  if (role === 'admin') return true;

  // 1. Cari teacher berdasarkan AuthID
  const teacher = await prisma.teacher.findUnique({
    where: { authId },
  });
  if (!teacher) return false; // Bukan teacher, pasti bukan pemilik

  // 2. Cari chapter DAN course induknya
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      course: true, // Sertakan data kursus
    },
  });
  if (!chapter) return false; // Chapter tidak ditemukan

  // 3. Bandingkan ID pemilik kursus dengan ID teacher
  return chapter.course.teacherId === teacher.id;
};


export const validateLessonOwnership = async (
  authId: string,
  lessonId: string,
  role: Role | string
) => {
  // Admin selalu bisa akses
  if (role === 'admin') return true;

  // 1. Cari teacher berdasarkan AuthID
  const teacher = await prisma.teacher.findUnique({
    where: { authId },
  });
  if (!teacher) return false; // Bukan teacher

  // 2. Cari lesson, chapter, DAN course induknya
  //    Ini adalah 'nested include' untuk melacak ke pemilik
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          course: true, // Sertakan data kursus induk
        },
      },
    },
  });
  if (!lesson || !lesson.chapter || !lesson.chapter.course) {
    return false; // Lesson/Chapter/Course tidak ditemukan
  }

  // 3. Bandingkan ID pemilik kursus dengan ID teacher
  return lesson.chapter.course.teacherId === teacher.id;
};

// ⛔️ FUNGSI 'validateUserEnrollment' DIHAPUS DARI SINI.
//
// Alasan:
// Berdasarkan arsitektur microservice kita, tabel 'Enrollment'
// adalah milik 'Payment-service', bukan 'App-service (BFF)'.
//
// BFF TIDAK BOLEH memanggil 'prisma.enrollment.findUnique' secara langsung.
//
// Sebagai gantinya, BFF (di dalam controller) harus memanggil
// fungsi 'checkEnrollmentService' (dari 'src/services/payment.service.ts')
// yang memanggil API 'Payment-service' (Go) internal.