export type BlogItem = {
  id: string;
  slug: string;
  date: string;
  views: number;
  title: string;
  img: string;
  authorName?: string | null;
};
