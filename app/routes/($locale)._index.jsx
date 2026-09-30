import {useLoaderData} from 'react-router';
import {loadStoreCatalog} from '~/lib/catalog';
import {Catalog} from '~/components/catalog/Catalog';
import {Hero, toScannerReads} from '~/components/home/Hero';
import {MockShopNotice} from '~/components/MockShopNotice';

const CATALOG_ID = 'catalogo';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'EST SA | Canal mayorista de identificación automática'},
    {
      name: 'description',
      content:
        'Lectores de código, impresoras térmicas, terminales móviles e insumos para distribuidores y revendedores en Chile.',
    },
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader({context, request}) {
  const {isLoggedIn, catalog} = await loadStoreCatalog({context, request});

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    isLoggedIn,
    catalog,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const {isShopLinked, isLoggedIn, catalog} = useLoaderData();
  const brands = catalog.vendors.slice(0, 6).map((vendor) => vendor.name);

  return (
    <div className="home">
      {isShopLinked ? null : (
        <div className="container-site">
          <MockShopNotice />
        </div>
      )}
      <Hero
        isLoggedIn={isLoggedIn}
        reads={toScannerReads(catalog.products.nodes)}
        catalogId={CATALOG_ID}
      />
      {brands.length ? <BrandStrip brands={brands} /> : null}
      <Catalog catalog={catalog} isLoggedIn={isLoggedIn} id={CATALOG_ID} />
    </div>
  );
}

/**
 * @param {{brands: string[]}}
 */
function BrandStrip({brands}) {
  return (
    <section className="container-site pb-10">
      <div className="fade-rule-y flex flex-wrap items-center gap-x-11 gap-y-3.5 py-4.5">
        <span className="text-xs text-neutral-500">
          Distribuidor autorizado
        </span>
        {brands.map((brand) => (
          <span
            key={brand}
            className="text-[17px] font-semibold tracking-[.02em] text-neutral-400"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}

/** @typedef {import('./+types/($locale)._index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
