export default function JsonLd() {
  const schoolSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Ayushman Educational Academy',
    alternateName: 'AEA',
    description: 'Ayushman Educational Academy, Semli Bari - Quality education with modern digital tools for efficient school administration, fee management, and student tracking.',
    url: 'https://school-fee-app.vercel.app',
    logo: 'https://school-fee-app.vercel.app/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Semli Bari',
      addressCountry: 'IN',
    },
    sameAs: [],
  }

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ayushman Educational Academy - Fee Management System',
    description: 'Smart School Fee Management & Student Attendance System. Track fees, manage students, generate reports with AI-powered insights.',
    url: 'https://school-fee-app.vercel.app',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    creator: {
      '@type': 'Organization',
      name: 'AV Infra',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ayushman Educational Academy',
    url: 'https://school-fee-app.vercel.app',
    description: 'Smart School Fee Management & Attendance System for Ayushman Educational Academy, Semli Bari.',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
