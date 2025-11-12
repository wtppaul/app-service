declare module 'slugify' {
  export default function slugify(
    str: string,
    options?: {
      replacement?: string;
      remove?: RegExp;
      lower?: boolean;
      strict?: boolean;
      locale?: string;
      trim?: boolean;
    }
  ): string;
}
