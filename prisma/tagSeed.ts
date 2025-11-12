import { PrismaClient } from '../generated/prisma';
import slugify from 'slugify';
const prisma = new PrismaClient();

const tags = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Photoshop',
  'Procreate',
  'Illustrator',
  'Premiere Pro',
  'DaVinci Resolve',
  'FL Studio',
  'Ableton Live',
  'Copywriting',
  'Storytelling',
  'Typography',
  'UI/UX',
  '3D Modeling',
  'Animation',
  'TouchDesigner',
  'AR/VR',
  'Wire Wrapping',
  'Resin Art',
  'YouTube',
  'TikTok',
  'Blogging',
  'Voiceover',
  'Color Grading',
  'NFT',
  'Web3',
  'Branding',
  'Game Design',

  // Tambahan yang lebih luas & relevan dengan kursus kontemporer
  'Freelancing',
  'Remote Work',
  'Portfolio Building',
  'Client Management',
  'Time Management',
  'Public Speaking',
  'Mind Mapping',
  'Figma',
  'Notion',
  'Midjourney',
  'ChatGPT',
  'Prompt Engineering',
  'Side Hustle',
  'Personal Finance',
  'Creative Thinking',
  'Digital Productivity',
  'Motion Graphics',
  'Creative Coding',
  'Sound Design',
];

function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true });
}

async function isSlugExists(slug: string): Promise<boolean> {
  const existing = await prisma.tag.findFirst({
    where: { slug },
  });
  return !!existing;
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let count = 1;
  while (await isSlugExists(slug)) {
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

async function main() {
  for (const tag of tags) {
    const baseSlug = generateSlug(tag);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    await prisma.tag.upsert({
      where: { name: tag },
      update: {},
      create: {
        name: tag,
        slug: uniqueSlug,
      },
    });
  }

  console.log('✅ Seeded tags successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
