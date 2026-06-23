import type { ReactElement, SVGProps } from 'react';
import type { Translate } from '../i18n';

type SocialLink = {
  href: string;
  labelKey: Parameters<Translate>[0];
  name: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
};

const socialLinks: SocialLink[] = [
  {
    name: 'X',
    href: 'https://x.com/SpelioApp',
    labelKey: 'social.xLabel',
    Icon: XIcon
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/SpelioApp',
    labelKey: 'social.instagramLabel',
    Icon: InstagramIcon
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/SpelioApp',
    labelKey: 'social.facebookLabel',
    Icon: FacebookIcon
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@SpelioApp',
    labelKey: 'social.youtubeLabel',
    Icon: YouTubeIcon
  }
];

export function SpelioSocialLinks({ t }: { t: Translate }) {
  return (
    <section className="spelio-social-links" aria-labelledby="spelio-social-links-title">
      <h2 id="spelio-social-links-title">{t('social.heading')}</h2>
      <div className="spelio-social-links-row">
        {socialLinks.map(({ href, labelKey, name, Icon }) => (
          <a
            key={name}
            className="spelio-social-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(labelKey)}
          >
            <Icon aria-hidden={true} />
          </a>
        ))}
      </div>
    </section>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path d="M13.7 10.6 21 2h-1.7l-6.4 7.4L7.9 2H2l7.7 11.2L2 22h1.7l6.8-7.9 5.4 7.9H22l-8.3-11.4Zm-2.4 2.8-.8-1.1L4.3 3.3h2.8l4.9 7 .8 1.1 6.5 9.4h-2.8l-5.2-7.4Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 1.8a4 4 0 0 0-4 4v8.4a4 4 0 0 0 4 4h8.4a4 4 0 0 0 4-4V7.8a4 4 0 0 0-4-4H7.8Zm4.2 3.6a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5-2.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path d="M13.6 22v-8.6h2.9l.5-3.4h-3.4V7.8c0-1 .3-1.7 1.7-1.7H17v-3A22 22 0 0 0 14.3 3c-2.7 0-4.5 1.6-4.5 4.6V10H6.7v3.4h3.1V22h3.8Z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12 2 12s0 3 .4 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8ZM10 15.2V8.8l5.4 3.2-5.4 3.2Z" />
    </svg>
  );
}
