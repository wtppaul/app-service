import { PrismaClient } from '../generated/prisma';
import slugify from 'slugify';

const prisma = new PrismaClient();

function generateUsername(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

async function isUsernameExists(
  username: string,
  type: 'teacher' | 'student'
): Promise<boolean> {
  if (type === 'teacher') {
    const existing = await prisma.teacher.findFirst({ where: { username } });
    return !!existing;
  } else {
    const existing = await prisma.student.findFirst({ where: { username } });
    return !!existing;
  }
}

async function generateUniqueUsername(
  base: string,
  type: 'teacher' | 'student'
): Promise<string> {
  let username = base;
  let count = 1;
  while (await isUsernameExists(username, type)) {
    username = `${base}${count}`;
    count++;
  }
  return username;
}

async function main() {
  // Seed Teacher
  const teachers = [
    {
      authId: 'auth-teacher-1',
      name: 'Alice Johnson',
      bio: 'Digital artist and educator',
    },
    {
      authId: 'auth-teacher-2',
      name: 'Brian Smith',
      bio: 'Music producer and sound designer',
    },
  ];

  for (const t of teachers) {
    const baseUsername = generateUsername(t.name);
    const uniqueUsername = await generateUniqueUsername(
      baseUsername,
      'teacher'
    );

    await prisma.teacher.upsert({
      where: { authId: t.authId },
      update: {
        name: t.name,
        bio: t.bio,
        username: uniqueUsername,
      },
      create: {
        authId: t.authId,
        name: t.name,
        bio: t.bio,
        username: uniqueUsername,
      },
    });
  }

  // Seed Student
  const students = [
    { authId: 'auth-student-1', name: 'Charlie Brown' },
    { authId: 'auth-student-2', name: 'Diana Prince' },
    { authId: 'auth-student-3', name: 'Ethan Hunt' },
  ];

  for (const s of students) {
    const baseUsername = generateUsername(s.name);
    const uniqueUsername = await generateUniqueUsername(
      baseUsername,
      'student'
    );

    await prisma.student.upsert({
      where: { authId: s.authId },
      update: {
        name: s.name,
        username: uniqueUsername,
      },
      create: {
        authId: s.authId,
        name: s.name,
        username: uniqueUsername,
      },
    });
  }

  console.log('✅ Seeded Teachers & Students successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
