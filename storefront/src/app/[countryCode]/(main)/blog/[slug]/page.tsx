import { notFound } from 'next/navigation'

import { getBlogPostBySlug } from '@lib/data/fetch'
import BlogPostTemplate from '@modules/blog/templates/blogPostTemplate'

export async function generateStaticParams() {
  // Temporarily disabled for build - Strapi service not available during build
  return []
}

export async function generateMetadata(props) {
  const params = await props.params
  const article = await getBlogPostBySlug(params.slug)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  return {
    title: article.Title,
  }
}

export default async function BlogPost(props: {
  params: Promise<{ slug: string; countryCode: string }>
}) {
  const params = await props.params
  const { slug, countryCode } = params
  const article = await getBlogPostBySlug(slug)

  if (!article) {
    notFound()
  }

  return <BlogPostTemplate article={article} countryCode={countryCode} />
}
