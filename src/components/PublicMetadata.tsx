import { useEffect } from 'react';
import { resolvePublicMetadata, type PublicMetadataInput } from '../lib/publicMetadata';

type PublicMetadataProps = PublicMetadataInput;

export function PublicMetadata(props: PublicMetadataProps) {
  useEffect(() => {
    const metadata = resolvePublicMetadata(props);

    document.title = metadata.title;
    setNamedMeta('description', metadata.description);
    setNamedMeta('robots', metadata.robots);
    setCanonical(metadata.canonicalUrl);
    setPropertyMeta('og:title', metadata.ogTitle);
    setPropertyMeta('og:description', metadata.ogDescription);
    setPropertyMeta('og:url', metadata.ogUrl);
    setNamedMeta('twitter:title', metadata.twitterTitle);
    setNamedMeta('twitter:description', metadata.twitterDescription);
    // Keep this SPA metadata layer small; consider SSR/prerendering later only if SEO limitations materially affect discovery.
  }, [props.interfaceLanguage, props.origin, props.pathname, props.screen, props.search, props.wordLists]);

  return null;
}

function setNamedMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setPropertyMeta(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}
