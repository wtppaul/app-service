import { PrismaClient } from '../generated/prisma';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  // ✅ Seed Tag
  const beginnerTag = await prisma.tag.upsert({
    where: { name: 'Beginner' },
    update: {},
    create: {
      name: 'Beginner',
      slug: 'beginner',
    },
  });

  // ✅ Ambil kategori dan subkategori dari DB
  const parentCategory = await prisma.category.findFirst({
    where: { name: 'Visual Arts & Painting', parentId: null },
  });

  const subCategory = await prisma.category.findFirst({
    where: {
      name: 'Digital Painting & Concept Illustration',
      parentId: parentCategory?.id,
    },
  });

  if (!parentCategory || !subCategory) {
    throw new Error('Kategori atau subkategori tidak ditemukan');
  }

  // ✅ Seed Teacher
  const teacherUsername = 'miniqus';
  const teacher = await prisma.teacher.upsert({
    where: { authId: 'teacher_auth_1' },
    update: {},
    create: {
      authId: 'teacher_auth_1',
      username: teacherUsername,
      name: 'John Doe',
      bio: 'Experienced visual artist',
    },
  });

  // ✅ Slugify untuk course
  const courseTitle = 'Master Digital Painting';
  const slug = `${slugify(courseTitle, {
    lower: true,
    strict: true,
  })}-${teacherUsername}`;

  // Pastikan slug tidak duplikat
  const existingCourse = await prisma.course.findUnique({
    where: { slug },
  });

  if (existingCourse) {
    throw new Error(`Slug ${slug} sudah digunakan oleh course lain`);
  }

  // ✅ Seed Course
  const course = await prisma.course.create({
    data: {
      title: courseTitle,
      slug,
      description:
        'An in-depth beginner course on digital painting techniques and tools.',
      thumbnail: 'https://example.com/image.png',
      price: 79.0,
      level: 'BEGINNER',
      status: 'PENDING_REVIEW',
      teacherId: teacher.id,
      tags: {
        connect: [{ id: beginnerTag.id }],
      },
      categories: {
        connect: [{ id: parentCategory.id }, { id: subCategory.id }],
      },
    },
  });

  // ✅ Seed Chapter
  const chapter = await prisma.chapter.create({
    data: {
      title: 'Introduction to Digital Painting',
      slug: 'introduction-to-digital-painting',
      order: 1,
      courseId: course.id,
    },
  });

  // ✅ Seed Lesson
  await prisma.lesson.create({
    data: {
      title: 'Getting Started with Tools',
      playbackId: 'samplePlaybackId',
      order: 1,
      chapterId: chapter.id,
    },
  });

  console.log('✅ courseSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
