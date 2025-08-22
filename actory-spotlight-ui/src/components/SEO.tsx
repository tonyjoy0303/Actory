import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
}

export default function SEO({ title, description, url }: SEOProps) {
  const fullTitle = `${title} | Actory`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url || (typeof window !== 'undefined' ? window.location.href : '/') } />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
}
