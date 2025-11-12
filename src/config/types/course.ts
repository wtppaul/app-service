// src/types/course.ts
export type CourseStatus =
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'PENDING_REVIEW'
  | 'FOLLOWED_UP'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';

export interface CourseStatusPub {
  status:
    | 'DRAFT'
    | 'INCOMPLETE'
    | 'PENDING_REVIEW'
    | 'FOLLOWED_UP'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'UNPUBLISHED'
    | 'ARCHIVED';
}

export interface CourseInput {
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  categoryIds: string[];
  hashtags?: string[];
  status?: CourseStatus;
}

// Tipe data internal untuk Service saat membuat course
export interface CourseCreateData extends CourseInput {
  slug: string;
  teacherId: string;
}

// Tipe data internal untuk Service saat update course
export interface CourseUpdateData {
  title?: string;
  teacherId?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  categoryIds?: string[];
  tagIds?: string[];
  hashtags?: string[];
  status?: string;
}

// Definisikan tipe untuk query params
export interface CourseQueryParams {
  status?: string;
  createdAt?: string;
  level?: string;
  search?: string;
}
