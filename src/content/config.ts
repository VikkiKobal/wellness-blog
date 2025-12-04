import { defineCollection, z } from 'astro:content';

// Define the blog articles collection schema
const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    author: z.string().default('Antonina Devitska'),
    date: z.string(),
    image: z.string(),
    category: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  articles: articlesCollection,
};

