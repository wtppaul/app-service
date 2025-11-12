import slugify from 'slugify';
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

const newCategory = {
  name: 'Creative Coding & Interactive Media Tes',
  description:
    'Menggabungkan seni, teknologi, dan pemrograman untuk menciptakan pengalaman interaktif.',
  subcategories: [
    {
      name: 'Generative Art with Code tes',
      description:
        'Gunakan kode untuk menciptakan pola visual yang unik dan dinamis.',
    },
    {
      name: 'Web-based Interactive Projects tes',
      description:
        'Kembangkan karya interaktif menggunakan teknologi web modern.',
    },
    {
      name: 'Physical Computing & Sensors tes',
      description:
        'Integrasikan sensor dan mikrokontroler untuk pengalaman berbasis interaksi fisik.',
    },
    {
      name: 'Data Visualization & Creative Mapping tes',
      description:
        'Ubah data kompleks menjadi narasi visual yang menarik dan artistik.',
    },
  ],
};

async function main() {
  const slug = slugify(newCategory.name, { lower: true, strict: true });

  const parent = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: {
      name: newCategory.name,
      slug,
      description: newCategory.description,
    },
  });

  for (const sub of newCategory.subcategories) {
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

  console.log('✅ New category seeded successfully.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
