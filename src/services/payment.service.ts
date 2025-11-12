/*
 * ==================================================================
 * File BARU: Klien API untuk Payment Service
 * ------------------------------------------------------------------
 * Kita buat file ini untuk menangani semua hal terkait 'Enrollment'
 * ==================================================================
 */
import axios, { AxiosInstance } from 'axios';

// (Asumsi payment-service berjalan di port 8084)
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8084';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

const apiClient: AxiosInstance = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_SECRET,
  },
});

/**
 * Memanggil Go service "bodoh" untuk mengecek pendaftaran
 */
export const checkEnrollmentService = async (authId: string, courseId: string): Promise<{ isEnrolled: boolean }> => {
  try {
    // (Asumsi endpoint Go Anda adalah: GET /internal/enrollments/check)
    const response = await apiClient.get('/internal/enrollments/check', {
      params: {
        userId: authId,
        courseId: courseId,
      },
    });
    return response.data; // Diharapkan: { isEnrolled: true }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error('Error in checkEnrollmentService (BFF):', err.response?.data || err.message);
    } else if (err instanceof Error) {
      console.error('Error in checkEnrollmentService (BFF):', err.message);
    } else {
      console.error('Unknown error in checkEnrollmentService (BFF):', err);
    }
    
    // Jika gagal (misal 404), anggap saja tidak terdaftar
    return { isEnrolled: false };
  }
};