import { MetadataRoute } from 'next';
import { readDB } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const db = readDB();
  const approvedBrands = db.brands.filter(b => b.status === 'approved');

  const brandUrls: MetadataRoute.Sitemap = approvedBrands.map(brand => ({
    url: `https://kuwaitb2bhub.com/brands/${brand.id}`,
    lastModified: new Date(brand.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: 'https://kuwaitb2bhub.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://kuwaitb2bhub.com/marketplace',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://kuwaitb2bhub.com/register',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://kuwaitb2bhub.com/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...brandUrls,
  ];
}
