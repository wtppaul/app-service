import slugify from 'slugify';
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const SubCategoryName = 'Creative Coding & Interactive Media Tes';
  const parentSlug = slugify(SubCategoryName, {
    lower: true,
    strict: true,
  });

  // Ambil kategori parent
  const parent = await prisma.category.findUnique({
    where: { slug: parentSlug },
  });

  if (!parent) {
    throw new Error('❌ Parent category not found.');
  }

  // Subkategori yang ingin ditambahkan
  const newSub = {
    name: 'Traditional Calligraphy & Decorative Lettering 11',
    description:
      'Pelajari seni menulis indah menggunakan pena tradisional dan teknik dekoratif.',
  };

  const subSlug = slugify(newSub.name, { lower: true, strict: true });

  // Insert subkategori baru
  await prisma.category.upsert({
    where: { slug: subSlug },
    update: {},
    create: {
      name: newSub.name,
      slug: subSlug,
      description: newSub.description,
      parentId: parent.id,
    },
  });

  console.log('✅ Subcategory added to : ', SubCategoryName);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
