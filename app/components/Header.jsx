import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, Form, Link, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {
  List,
  LockSimple,
  MagnifyingGlass,
  ShoppingCartSimple,
} from '~/components/Icons';

/** Used until a logo is uploaded in Shopify admin → Settings → Brand. */
const FALLBACK_LOGO_URL =
  'https://www.estsa.cl/catalogo/img/estsa-logo-1619559287.jpg';

/**
 * @param {HeaderProps}
 */
export function Header({
  header,
  isLoggedIn,
  customer,
  cart,
  publicStoreDomain,
}) {
  const {shop, menu} = header;

  return (
    <header className="sticky top-0 z-30 bg-bg/78 backdrop-blur-[14px]">
      <div className="container-site flex flex-wrap items-center gap-x-5.5 gap-y-3 py-3.5">
        <HeaderMenuMobileToggle />
        <Link
          to="/"
          prefetch="intent"
          aria-label={shop.name}
          className="flex flex-none items-center"
        >
          <Logo
            src={shop.brand?.logo?.image?.url ?? FALLBACK_LOGO_URL}
            alt={shop.name}
          />
        </Link>

        <HeaderSearch />

        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />

        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          <Suspense fallback={<SignedOutCtas />}>
            <Await resolve={isLoggedIn} errorElement={<SignedOutCtas />}>
              {(loggedIn) =>
                loggedIn ? (
                  <>
                    <Suspense fallback={<AccountChip customer={null} />}>
                      <Await resolve={customer} errorElement={null}>
                        {(resolved) => <AccountChip customer={resolved} />}
                      </Await>
                    </Suspense>
                    <CartToggle cart={cart} />
                  </>
                ) : (
                  <SignedOutCtas />
                )
              }
            </Await>
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/**
 * The source logo is dark-on-white; this inverts it and tints it violet so
 * it sits on the dark header (the "Violeta" option from the design).
 * @param {{src: string; alt: string}}
 */
function Logo({src, alt}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  // The image can fail before hydration attaches onError, so check once.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span className="text-[22px] font-semibold tracking-[-.02em] text-accent-400">
        {alt}
      </span>
    );
  }

  return (
    <span className="relative isolate block h-[34px] mix-blend-lighten">
      <img
        ref={ref}
        src={src}
        alt={alt}
        height={34}
        onError={() => setFailed(true)}
        className="block h-[34px] w-auto [filter:grayscale(1)_invert(1)_contrast(1.6)]"
      />
      <span className="absolute inset-0 bg-accent-500 mix-blend-multiply" />
    </span>
  );
}

function HeaderSearch() {
  return (
    <Form
      method="get"
      action="/search"
      role="search"
      className="relative order-last flex w-full items-center md:order-none md:max-w-[560px] md:flex-[1_1_280px]"
    >
      <MagnifyingGlass
        size={17}
        className="pointer-events-none absolute left-3 text-neutral-500"
      />
      <label htmlFor="header-search" className="sr-only">
        Buscar productos
      </label>
      <input
        id="header-search"
        className="input bg-surface/80 pl-[38px]"
        type="search"
        name="q"
        placeholder="Buscar por modelo, SKU o marca"
        autoComplete="off"
      />
    </Form>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const {close} = useAside();
  const isDesktop = viewport === 'desktop';

  return (
    <nav
      className={
        isDesktop
          ? 'ml-auto hidden items-center gap-5 text-sm md:flex'
          : 'flex flex-col gap-1 px-5.5 pb-6 text-base'
      }
      role="navigation"
    >
      {!isDesktop && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className={navLinkClass(viewport)}
        >
          Inicio
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className={navLinkClass(viewport)}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** @param {Viewport} viewport */
function navLinkClass(viewport) {
  const base =
    viewport === 'desktop'
      ? 'whitespace-nowrap'
      : 'rounded-md px-2.5 py-2.5 hover:bg-text/6';
  return ({isActive, isPending}) =>
    `${base} ${
      isActive
        ? 'text-text'
        : isPending
          ? 'text-neutral-600'
          : 'text-neutral-400'
    } hover:text-accent-400`;
}

function SignedOutCtas() {
  return (
    <>
      <Link
        to="/account/login"
        className="btn btn-secondary px-3.5 max-sm:hidden"
      >
        <LockSimple size={16} />
        Ingresar
      </Link>
      <Link to="/account/login" className="btn btn-secondary px-3 sm:hidden">
        <LockSimple size={16} />
        <span className="sr-only">Ingresar</span>
      </Link>
      <Link to="/solicitar-cuenta" className="btn btn-brand">
        Solicitar cuenta
      </Link>
    </>
  );
}

/**
 * @param {{customer: CustomerHeaderQuery['customer'] | null}}
 */
function AccountChip({customer}) {
  const company = customer?.companyContacts?.nodes?.[0]?.company?.name;
  const person = [customer?.firstName, customer?.lastName]
    .filter(Boolean)
    .join(' ');
  const title = company || person || customer?.displayName || 'Mi cuenta';
  const initials =
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'EST';

  return (
    <Link
      to="/account"
      prefetch="intent"
      className="flex animate-pop-in items-center gap-2.5 rounded-full bg-surface py-1 pr-3 pl-1 text-text shadow-sm hover:text-text hover:shadow-[0_0_0_1px_var(--color-accent-700)]"
    >
      <span className="grid size-8 place-items-center rounded-full bg-accent-800 text-xs font-semibold text-accent-200">
        {initials}
      </span>
      <span className="flex flex-col leading-[1.2] max-sm:hidden">
        <span className="max-w-[180px] truncate text-[13px] font-medium">
          {title}
        </span>
        <span className="text-[11px] text-accent-300">Cuenta mayorista</span>
      </span>
    </Link>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="btn btn-icon btn-secondary border-0 md:hidden"
      onClick={() => open('mobile')}
      aria-label="Abrir menú"
    >
      <List size={20} />
    </button>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      aria-label={`Orden de compra (${count} productos)`}
      className="btn btn-secondary relative h-10 w-[42px] p-0"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <ShoppingCartSimple size={19} />
      {count ? (
        <span
          key={count}
          className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] animate-bump place-items-center rounded-[9px] bg-brand px-[5px] text-[11px] font-semibold text-neutral-100 shadow-[0_0_0_2px_var(--color-bg)]"
        >
          {count}
        </span>
      ) : null}
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

/** Shown until a "main-menu" navigation is set up in Shopify admin. */
const FALLBACK_HEADER_MENU = {
  id: 'fallback-main-menu',
  items: [
    {
      id: 'fallback-catalogo',
      resourceId: null,
      tags: [],
      title: 'Catálogo',
      type: 'HTTP',
      url: '/collections/all',
      items: [],
    },
    {
      id: 'fallback-categorias',
      resourceId: null,
      tags: [],
      title: 'Categorías',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'fallback-servicio-tecnico',
      resourceId: null,
      tags: [],
      title: 'Servicio técnico',
      type: 'PAGE',
      url: '/pages/servicio-tecnico',
      items: [],
    },
  ],
};

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {Promise<CustomerHeaderQuery['customer'] | null>} customer
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('customer-accountapi.generated').CustomerHeaderQuery} CustomerHeaderQuery */
