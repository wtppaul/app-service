import slugify from 'slugify';
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const SubCategoryName = 'Creative Coding & Interactive Media Tes';
  const parentSlug = slugify(SubCategoryName, {
    lower: true,
    strict: true,
  });

  // Cari parent category
  const parent = await prisma.category.findUnique({
    where: { slug: parentSlug },
  });

  if (!parent) {
    throw new Error('❌ Parent category not found.');
  }

  // Daftar subkategori yang ingin ditambahkan
  const newSubcategories = [
    {
      name: 'Traditional Calligraphy & Decorative Lettering 22',
      description:
        'Pelajari seni menulis indah menggunakan pena tradisional dan teknik dekoratif.',
    },
    {
      name: 'Gold Leaf & Gilding Techniques 22',
      description:
        'Eksplorasi teknik menghias dengan lembaran emas dan efek berkilau.',
    },
    {
      name: 'Pattern Creation & Ornament Illustration 22',
      description:
        'Belajar menggambar ornamen dan pola yang mengulang secara harmonis.',
    },
  ];

  for (const sub of newSubcategories) {
    const subSlug = slugify(sub.name, { lower: true, strict: true });

    await prisma.category.upsert({
      where: { slug: subSlug },
      update: {},
      create: {
        name: sub.name,
        slug: subSlug,
        description: sub.description,
        parentId: parent.id,
      },
    });
  }

  console.log(
    `✅ ${newSubcategories.length} subcategories ditambahkan ke kategori "${parent.name}".`
  );
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
