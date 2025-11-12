import { PrismaClient } from '../generated/prisma';
import slugify from 'slugify';

const prisma = new PrismaClient();

const newTags = [
  'Prompt Engineering',
  'Stable Diffusion',
  'Notion Workflow',
  'Motion Graphics',
  'After Effects',
  'Marketing Funnel',
  'Digital Strategy',
  'Sound Design',
  'Creative Writing',
  'Data Storytelling',
];

function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = generateSlug(base);
  let uniqueSlug = slug;
  let counter = 1;

  while (await prisma.tag.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

async function main() {
  for (const name of newTags) {
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      console.log(`⚠️ Tag "${name}" already exists, skipping.`);
      continue;
    }

    const slug = await generateUniqueSlug(name);

    await prisma.tag.create({
      data: { name, slug },
    });

    console.log(`✅ Created tag: ${name} (${slug})`);
  }

  console.log('🎉 Finished seeding new tags!');
}

main()
  .catch((e) => {
    console.error('❌ Error while seeding tags:', e);
  })
  .finally(() => prisma.$disconnect());
