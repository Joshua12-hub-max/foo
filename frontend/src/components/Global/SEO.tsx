import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

const SEO = ({
  title = "CHRMO Mey - City of Meycauayan",
  description = "Official recruitment and employee management portal for the City of Meycauayan.",
  keywords = "Meycauayan, CHRMO Mey, Recruitment, HRMS, City Government",
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl = window.location.href,
}: SEOProps) => {
  const siteTitle = title.includes("CHRMO Mey") ? title : `${title} | CHRMO Mey`;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || description} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={ogTitle || siteTitle} />
      <meta property="twitter:description" content={ogDescription || description} />
      {ogImage && <meta property="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEO;
