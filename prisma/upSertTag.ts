import { PrismaClient } from '../generated/prisma';

// seed data tags tanpa mengubah yang sudah ada,
// kita bisa pakai upsert atau createMany({ skipDuplicates: true }) dari Prisma.
const prisma = new PrismaClient();

async function main() {
  const newTags = ['Test-1', 'Test-2', 'Kelly', 'Voiceover'];

  // Siapkan data dengan format { name: string }
  const tagData = newTags.map((tag) => ({ name: tag }));

  await prisma.tag.createMany({
    data: tagData,
    skipDuplicates: true, // tidak akan buat jika sudah ada
  });

  console.log('Tags seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
