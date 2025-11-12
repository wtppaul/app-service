import slugify from 'slugify';
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

// Struktur data: setiap kategori utama berisi deskripsi & daftar subkategori (dengan deskripsinya)
const categories = [
  {
    name: 'Visual Arts & Painting',
    description:
      '2D visual expression through both digital and traditional media.',
    subcategories: [
      {
        name: 'Digital Painting & Concept Illustration',
        description:
          'Create digital artwork for concept design and visual development.',
      },
      {
        name: 'Watercolor & Ink Techniques',
        description: 'Explore expressive techniques using watercolor and ink.',
      },
      {
        name: 'Acrylic, Oil & Mixed Media',
        description:
          'Combine various painting techniques and mediums for unique outcomes.',
      },
      {
        name: 'Sketchbook Practices & Visual Journaling',
        description:
          'Develop daily drawing and journaling habits to strengthen creativity.',
      },
    ],
  },
  {
    name: 'Illustration & Narrative Drawing',
    description:
      'Telling visual stories through illustration, character design, and comics.',
    subcategories: [
      {
        name: 'Character & Creature Design',
        description:
          'Design unique characters and imaginative creatures with personality.',
      },
      {
        name: 'Children’s Book Illustration',
        description:
          'Illustrate playful and engaging visuals for children’s literature.',
      },
      {
        name: 'Stylized Portraits & Line Work',
        description:
          'Create expressive portraits and illustrations using distinctive line styles.',
      },
      {
        name: 'Visual Storyboarding & Comics',
        description:
          'Learn how to plan and tell stories through comic art and storyboards.',
      },
    ],
  },
  {
    name: 'Textile & Fiber Explorations',
    description:
      'Exploration of fibers and fabrics through creative and tactile processes.',
    subcategories: [
      {
        name: 'Weaving & Loom Fundamentals',
        description:
          'Create woven textiles using traditional and modern techniques.',
      },
      {
        name: 'Fabric Dyeing & Surface Design',
        description: 'Experiment with dye and print techniques on fabric.',
      },
      {
        name: 'Embroidery & Thread-Based Art',
        description: 'Use threads to create intricate and decorative artworks.',
      },
      {
        name: 'Soft Sculpture & Fiber Forms',
        description:
          'Make 3D art using soft, pliable materials and fiber structures.',
      },
    ],
  },
  {
    name: 'Wearable Art & Artisan Craft',
    description:
      'Handcrafted fashion and accessories merging creativity with function.',
    subcategories: [
      {
        name: 'Jewelry Making (Wire, Resin, Metal Clay)',
        description: 'Design and create unique handmade jewelry pieces.',
      },
      {
        name: 'Leather Craft & Hand Stitching',
        description: 'Craft functional and decorative leather goods by hand.',
      },
      {
        name: 'Custom Apparel Design',
        description: 'Design and tailor personalized fashion pieces.',
      },
      {
        name: 'Artisan Bags & Accessories',
        description:
          'Create bags and wearable items with artisanal techniques.',
      },
    ],
  },
  {
    name: 'Ceramics & Form Studies',
    description:
      'Clay-based art and sculpture, from functional to conceptual forms.',
    subcategories: [
      {
        name: 'Handbuilding & Wheel Throwing',
        description:
          'Shape clay into vessels and forms using hand or wheel techniques.',
      },
      {
        name: 'Surface & Glazing Techniques',
        description: 'Decorate ceramics with glaze, pattern, and texture.',
      },
      {
        name: 'Sculptural Ceramics',
        description: 'Create expressive and experimental clay artworks.',
      },
      {
        name: 'Functional Tableware',
        description: 'Design practical ceramic objects for everyday use.',
      },
    ],
  },
  {
    name: 'Wood & Material Craft',
    description:
      'Explorations in crafting with wood and mixed solid materials.',
    subcategories: [
      {
        name: 'Wood Carving & Joinery',
        description:
          'Shape and join wood to create functional or decorative objects.',
      },
      {
        name: 'Tool-Based Object Crafting',
        description: 'Use hand and power tools to make custom-crafted items.',
      },
      {
        name: 'Mixed Material Construction',
        description: 'Blend wood with other materials like resin and metal.',
      },
      {
        name: 'Sculptural Woodwork',
        description: 'Craft expressive wooden sculptures with creative form.',
      },
    ],
  },
  {
    name: 'Brand & Visual Identity Design',
    description: 'Develop cohesive branding systems and visual narratives.',
    subcategories: [
      {
        name: 'Logo & Symbol Design',
        description: 'Design impactful logos and icons that represent a brand.',
      },
      {
        name: 'Typography & Type Systems',
        description: 'Explore typographic design as a visual branding tool.',
      },
      {
        name: 'Brand Strategy & Voice',
        description:
          'Build identity systems with strategic tone and positioning.',
      },
      {
        name: 'Portfolio & Mockup Presentation',
        description:
          'Present creative work in polished and professional formats.',
      },
    ],
  },
  {
    name: 'Creative Thinking & Artistic Process',
    description: 'Sharpen your mindset, process, and unique creative identity.',
    subcategories: [
      {
        name: 'Daily Creative Habits',
        description:
          'Build discipline and inspiration through daily creative routines.',
      },
      {
        name: 'Art Journaling & Idea Mapping',
        description:
          'Organize thoughts and visualize ideas through sketchbooks and journals.',
      },
      {
        name: 'Concept Development',
        description:
          'Take ideas from rough sketches to fully developed creative work.',
      },
      {
        name: 'Visual Voice Exploration',
        description:
          'Discover your unique artistic identity and visual language.',
      },
    ],
  },
  {
    name: 'Camera-Based Expression',
    description:
      'Create expressive still and moving imagery using camera techniques.',
    subcategories: [
      {
        name: 'Photographic Mood & Composition',
        description: 'Master photography fundamentals for mood and impact.',
      },
      {
        name: 'Portrait & Editorial Imagery',
        description: 'Create compelling portraits and styled photo shoots.',
      },
      {
        name: 'Visual Storytelling through Motion',
        description: 'Tell dynamic stories through video and moving visuals.',
      },
      {
        name: 'Experimental Camera Techniques',
        description:
          'Explore unconventional and artistic camera-based methods.',
      },
    ],
  },
];

async function main() {
  for (const category of categories) {
    const slug = slugify(category.name, { lower: true, strict: true });

    const parent = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: category.name,
        slug,
        description: category.description,
      },
    });

    for (const sub of category.subcategories) {
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
  }

  console.log('✅ Categories with slugs seeded successfully');
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
