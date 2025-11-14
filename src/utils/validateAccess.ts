import { prisma } from './prisma';
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