/**
 * CMS Audit Utility
 * Performs real-time analysis of the portfolio data to calculate health scores.
 */

export const performCmsAudit = ({ pagesData = {}, globalSettings = {}, stickersData = {}, projects = [] } = {}) => {
  let issues = [];
  let score = 100;

  // 1. Check Global SEO
  if (!globalSettings?.siteTitle) {
    issues.push({ type: 'error', msg: 'Site Title Tag belum diatur di Settings' });
    score -= 15;
  }

  // 2. Check Pages Meta
  const systemPages = ['home', 'portofolio', 'biodata'];
  const customPages = globalSettings?.customPages || [];
  const allSlugs = [...systemPages, ...customPages.map(p => p.slug)];

  allSlugs.forEach(slug => {
    const blocks = pagesData?.[slug] || [];
    if (blocks.length === 0) {
      issues.push({ type: 'warning', msg: `Halaman "${slug}" masih kosong` });
      score -= 5;
    }

    // Check for broken links or empty content in blocks
    blocks.forEach((block, idx) => {
      if (block.type === 'image' && !block.url) {
        issues.push({ type: 'warning', msg: `Blok gambar #${idx+1} di ${slug} tidak memiliki URL` });
        score -= 2;
      }
    });
  });

  // 3. Check Branding
  if (!globalSettings?.cmsLogo) {
    issues.push({ type: 'info', msg: 'Saran: Tambahkan logo CMS untuk branding premium' });
    score -= 2;
  }

  // 4. Check Projects
  if (projects.length === 0) {
    issues.push({ type: 'info', msg: 'Belum ada proyek yang terdaftar di sistem' });
  }

  // 5. Check Stickers
  if (stickersData && typeof stickersData === 'object') {
    Object.entries(stickersData).forEach(([page, list]) => {
      if (Array.isArray(list)) {
        list.forEach((st, idx) => {
          if (!st.url && !st.svgContent && !st.text) {
            issues.push({ type: 'warning', msg: `Stiker #${idx+1} di ${page} tidak memiliki konten visual` });
            score -= 1;
          }
        });
      }
    });
  }

  return {
    score: Math.max(score, 0),
    issues: issues.slice(0, 10),
    healthStatus: score > 90 ? 'EXCELLENT' : score > 70 ? 'GOOD' : 'NEEDS ATTENTION'
  };
};
