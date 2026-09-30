import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
  return (
    <footer className="fade-rule-top mt-auto">
      <div className="container-site flex flex-wrap items-center gap-x-10 gap-y-4 py-7 text-[13px] text-neutral-500">
        <span className="font-medium text-neutral-300">
          {header?.shop.name ?? 'EST SA'}
        </span>
        <span>Soluciones de identificación automática · Santiago, Chile</span>
        <Suspense>
          <Await resolve={footerPromise}>
            {(footer) =>
              header?.shop.primaryDomain?.url ? (
                <FooterMenu
                  menu={footer?.menu}
                  primaryDomainUrl={header.shop.primaryDomain.url}
                  publicStoreDomain={publicStoreDomain}
                />
              ) : null
            }
          </Await>
        </Suspense>
        <span className="md:ml-auto">
          Precios netos en CLP, no incluyen IVA. Sujetos a stock.
        </span>
      </div>
    </footer>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'] | undefined;
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu({menu, primaryDomainUrl, publicStoreDomain}) {
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-2" role="navigation">
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a
            href={url}
            key={item.id}
            rel="noopener noreferrer"
            target="_blank"
            className="text-neutral-400 hover:text-accent-300"
          >
            {item.title}
          </a>
        ) : (
          <NavLink
            end
            key={item.id}
            prefetch="intent"
            to={url}
            className={({isActive}) =>
              `${isActive ? 'text-text' : 'text-neutral-400'} hover:text-accent-300`
            }
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Shown until a "footer" navigation is set up in Shopify admin. */
const FALLBACK_FOOTER_MENU = {
  id: 'fallback-footer-menu',
  items: [
    {
      id: 'fallback-privacy',
      resourceId: null,
      tags: [],
      title: 'Privacidad',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'fallback-shipping',
      resourceId: null,
      tags: [],
      title: 'Despacho',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'fallback-terms',
      resourceId: null,
      tags: [],
      title: 'Términos',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
