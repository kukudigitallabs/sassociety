/**
 * Dynamic Meta Tags & SEO Updater
 * Updates document.title, favicon, and SEO meta tags based on platform settings.
 */
export function applyPlatformMeta(settings?: Record<string, any> | null) {
  if (!settings) return;

  // 1. Title
  if (settings.meta_title || settings.platform_name) {
    document.title = settings.meta_title || `${settings.platform_name} — Enterprise Housing & Society Management`;
  }

  // 2. Meta Description
  if (settings.meta_description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', settings.meta_description);
  }

  // 3. Meta Keywords
  if (settings.meta_keywords) {
    let metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement('meta');
      metaKw.setAttribute('name', 'keywords');
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute('content', settings.meta_keywords);
  }

  // 4. OpenGraph Tags
  if (settings.meta_title) {
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', settings.meta_title);
  }

  if (settings.meta_description) {
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', settings.meta_description);
  }

  if (settings.meta_og_image || settings.logo_url) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', settings.meta_og_image || settings.logo_url);
  }

  // 5. Favicon
  if (settings.favicon_url || settings.logo_url) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = settings.favicon_url || settings.logo_url;
  }

  // 6. Custom Header Scripts (e.g. Google Analytics or Tag Manager)
  if (settings.custom_header_scripts && !document.getElementById('custom-platform-header-scripts')) {
    try {
      const container = document.createElement('div');
      container.id = 'custom-platform-header-scripts';
      container.innerHTML = settings.custom_header_scripts;
      // Execute any inline scripts
      const scripts = container.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const s = document.createElement('script');
        if (scripts[i].src) s.src = scripts[i].src;
        if (scripts[i].innerHTML) s.innerHTML = scripts[i].innerHTML;
        document.head.appendChild(s);
      }
    } catch (e) {
      console.warn('[SocietyOS] Could not inject custom header scripts:', e);
    }
  }

  // 7. Google Analytics ID
  if (settings.google_analytics_id && !document.getElementById('google-analytics-script')) {
    try {
      const gaScript = document.createElement('script');
      gaScript.id = 'google-analytics-script';
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.google_analytics_id)}`;
      document.head.appendChild(gaScript);

      const gaInit = document.createElement('script');
      gaInit.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_analytics_id}');
      `;
      document.head.appendChild(gaInit);
    } catch {}
  }
}

