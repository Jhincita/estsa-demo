import {Link, useLocation} from 'react-router';
import {Pagination} from '@shopify/hydrogen';
import {CATALOG_SORTS, PAGINATION_PARAMS} from '~/lib/catalog';
import {Barcode, Check, LockSimple, Storefront} from '~/components/Icons';
import {CategoryIcon} from '~/components/catalog/CategoryIcon';
import {ProductCard} from '~/components/catalog/ProductCard';

/**
 * Wholesale catalog: category + brand filters, stock toggle, sort, and a
 * product grid whose prices unlock when the customer signs in.
 * @param {{
 *   catalog: Catalog;
 *   isLoggedIn: boolean;
 *   id?: string;
 * }}
 */
export function Catalog({catalog, isLoggedIn, id}) {
  const {params, products} = catalog;
  const hrefWith = useCatalogHref();

  return (
    <section
      id={id}
      className="container-site flex scroll-mt-20 flex-wrap items-start gap-8 pt-3 pb-18"
    >
      <aside className="flex max-w-full flex-[1_1_220px] flex-col gap-6.5 lg:sticky lg:top-24 lg:max-w-[260px]">
        <FilterGroup title="Categorías">
          <CategoryLink
            to="/collections/all"
            label="Todo el catálogo"
            active={catalog.handle === 'all'}
          />
          {catalog.collections
            .filter((c) => c.handle !== 'all' && c.handle !== 'frontpage')
            .map((collection) => (
              <CategoryLink
                key={collection.id}
                to={`/collections/${collection.handle}`}
                label={collection.title}
                active={collection.handle === catalog.handle}
              />
            ))}
        </FilterGroup>

        {catalog.vendors.length ? (
          <FilterGroup title="Marca">
            {catalog.vendors.map((vendor) => {
              const on = params.vendors.includes(vendor.name);
              return (
                <Link
                  key={vendor.name}
                  to={hrefWith((sp) => toggleValue(sp, 'marca', vendor.name))}
                  preventScrollReset
                  replace
                  role="checkbox"
                  aria-checked={on}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm text-text hover:bg-text/6 hover:text-text"
                >
                  <span
                    className={`grid size-4 place-items-center rounded-sm border-[1.5px] transition-all duration-150 ${
                      on
                        ? 'border-accent-500 bg-brand'
                        : 'border-neutral-700 bg-transparent'
                    }`}
                  >
                    {on ? (
                      <Check
                        size={11}
                        weight="bold"
                        className="text-neutral-100"
                      />
                    ) : null}
                  </span>
                  <span className="flex-1">{vendor.name}</span>
                  {vendor.count != null ? (
                    <span className="text-xs tabular-nums text-neutral-500">
                      {vendor.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </FilterGroup>
        ) : null}

        <Link
          to={hrefWith((sp) =>
            params.inStock ? sp.delete('stock') : sp.set('stock', '1'),
          )}
          preventScrollReset
          replace
          role="switch"
          aria-checked={params.inStock}
          className="flex items-center justify-between gap-2.5 rounded-md bg-surface p-2.5 text-sm text-text hover:text-text"
        >
          Solo con stock
          <span
            className={`relative h-5 w-[34px] rounded-full transition-colors duration-200 ${
              params.inStock ? 'bg-brand' : 'bg-neutral-800'
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-neutral-100 transition-[left] duration-200 ${
                params.inStock ? 'left-4' : 'left-0.5'
              }`}
            />
          </span>
        </Link>

        {!isLoggedIn ? (
          <div className="flex flex-col gap-2.5 rounded-md bg-[linear-gradient(160deg,var(--color-accent-900),var(--color-surface))] p-4 shadow-[0_0_0_1px_var(--color-accent-800)]">
            <Storefront size={22} className="text-accent-300" />
            <span className="text-[15px] leading-[1.3] font-medium">
              ¿Revendes tecnología de retail?
            </span>
            <span className="text-[13px] leading-normal text-neutral-400">
              Abre tu cuenta mayorista y accede a precios de lista, crédito y
              despacho preferente.
            </span>
            <Link to="/solicitar-cuenta" className="btn btn-outline self-start">
              Solicitar cuenta
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4.5">
        <div className="flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <h2 className="m-0 mb-0.5 text-[28px] tracking-[-.02em]">
              {catalog.title}
            </h2>
            <span className="text-[13px] text-neutral-500">
              {resultLabel(products, isLoggedIn)}
            </span>
          </div>
          <div className="seg" role="radiogroup" aria-label="Ordenar">
            {CATALOG_SORTS.map((sort) => (
              <Link
                key={sort.id}
                to={hrefWith((sp) =>
                  sort.id === 'relevancia'
                    ? sp.delete('orden')
                    : sp.set('orden', sort.id),
                )}
                preventScrollReset
                replace
                role="radio"
                aria-checked={params.sort === sort.id}
                className="seg-opt"
              >
                {sort.label}
              </Link>
            ))}
          </div>
        </div>

        {catalog.description ? (
          <p className="m-0 max-w-[640px] text-sm text-neutral-400">
            {catalog.description}
          </p>
        ) : null}

        {!isLoggedIn ? <LockedBanner /> : null}

        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) =>
            nodes.length ? (
              <>
                <PreviousLink className="btn btn-secondary self-center">
                  {isLoading ? 'Cargando…' : 'Ver productos anteriores'}
                </PreviousLink>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-4">
                  {nodes.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isLoggedIn={isLoggedIn}
                      index={index}
                    />
                  ))}
                </div>
                <NextLink className="btn btn-secondary self-center">
                  {isLoading ? 'Cargando…' : 'Ver más productos'}
                </NextLink>
              </>
            ) : (
              <EmptyState clearHref={hrefWith(clearFilters)} />
            )
          }
        </Pagination>
      </div>
    </section>
  );
}

function LockedBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-md bg-[color-mix(in_srgb,var(--color-brand)_14%,var(--color-surface))] px-4 py-3.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand)_55%,transparent)]">
      <span className="grid size-9 flex-none place-items-center rounded-full bg-accent-800 text-accent-200">
        <LockSimple size={18} />
      </span>
      <div className="flex flex-[1_1_260px] flex-col gap-0.5">
        <span className="text-sm font-medium">
          Precios y compra reservados para clientes mayoristas
        </span>
        <span className="text-[13px] text-neutral-400">
          Ingresa con tu cuenta de empresa para ver tu lista de precios y
          comprar en línea.
        </span>
      </div>
      <Link to="/account/login" className="btn btn-brand min-h-[38px]">
        Ingresar
      </Link>
    </div>
  );
}

/** @param {{clearHref: string}} */
function EmptyState({clearHref}) {
  return (
    <div className="flex flex-col gap-2 py-12 text-neutral-400">
      <Barcode size={32} className="text-neutral-600" />
      <span className="text-base text-text">
        Sin resultados para estos filtros
      </span>
      <Link
        to={clearHref}
        preventScrollReset
        className="btn btn-ghost self-start"
      >
        Limpiar filtros
      </Link>
    </div>
  );
}

/**
 * @param {{title: string; children: React.ReactNode}}
 */
function FilterGroup({title, children}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="kicker mb-2">{title}</span>
      {children}
    </div>
  );
}

/**
 * @param {{to: string; label: string; active: boolean}}
 */
function CategoryLink({to, label, active}) {
  return (
    <Link
      to={to}
      prefetch="intent"
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-text/6 ${
        active
          ? 'bg-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] text-accent-200 hover:text-accent-200'
          : 'text-neutral-300 hover:text-neutral-200'
      }`}
    >
      <CategoryIcon name={label} />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

/**
 * Returns a builder for links that change catalog filters while keeping
 * the others. Changing a filter always resets pagination.
 */
function useCatalogHref() {
  const {pathname, search} = useLocation();
  /** @param {(params: URLSearchParams) => void} change */
  return (change) => {
    const params = new URLSearchParams(search);
    PAGINATION_PARAMS.forEach((key) => params.delete(key));
    change(params);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
}

/**
 * @param {URLSearchParams} params
 * @param {string} key
 * @param {string} value
 */
function toggleValue(params, key, value) {
  const values = params.getAll(key);
  params.delete(key);
  const next = values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
  next.forEach((v) => params.append(key, v));
}

/** @param {URLSearchParams} params */
function clearFilters(params) {
  ['marca', 'stock', 'orden'].forEach((key) => params.delete(key));
}

/**
 * @param {Catalog['products']} products
 * @param {boolean} isLoggedIn
 */
function resultLabel(products, isLoggedIn) {
  const count = products.nodes.length;
  const more = products.pageInfo.hasNextPage ? '+' : '';
  const noun = count === 1 && !more ? 'producto' : 'productos';
  return `${count}${more} ${noun}${isLoggedIn ? ' · precios netos' : ''}`;
}

/**
 * @typedef {{
 *   handle: string;
 *   title: string;
 *   description: string | null;
 *   params: import('~/lib/catalog').CatalogParams;
 *   collections: Array<{id: string; handle: string; title: string}>;
 *   vendors: Array<{name: string; count: number | null}>;
 *   products: {
 *     nodes: Array<import('storefrontapi.generated').CatalogProductFragment>;
 *     pageInfo: {
 *       hasPreviousPage: boolean;
 *       hasNextPage: boolean;
 *       startCursor?: string | null;
 *       endCursor?: string | null;
 *     };
 *   };
 * }} Catalog
 */
