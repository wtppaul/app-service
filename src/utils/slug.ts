import slugify from 'slugify';

export const generateCourseSlug = (title: string, username: string): string => {
  const cleanTitle = slugify(title || '', { lower: true, strict: true });
  const cleanUsername = slugify(username || '', { lower: true, strict: true });

  if (!cleanTitle || !cleanUsername) {
    throw new Error(
      'Title and username are required to generate a course slug'
    );
  }

  return `${cleanTitle}-${cleanUsername}`;
};

export function generateChapterSlug(
  courseSlug: string,
  chapterNumber: number
): string {
  return slugify(`${courseSlug}-chapter-${chapterNumber}`, { lower: true });
}
