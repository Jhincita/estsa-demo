import {getPaginationVariables} from '@shopify/hydrogen';
import {redactProductPrices} from '~/lib/b2b';

/**
 * Catalog filters live in the URL so every view is linkable and works
 * without JavaScript:  ?marca=Zebra&marca=Honeywell&stock=1&orden=nombre
 */
export const CATALOG_SORTS = [
  {id: 'relevancia', label: 'Relevancia'},
  {id: 'nombre', label: 'Nombre'},
  {id: 'novedades', label: 'Novedades'},
];

export const CATALOG_PAGE_SIZE = 12;

/** Params that belong to pagination and must reset when filters change. */
export const PAGINATION_PARAMS = ['cursor', 'direction'];

/**
 * @param {Request} request
 * @return {CatalogParams}
 */
export function getCatalogParams(request) {
  const searchParams = new URL(request.url).searchParams;
  const orden = searchParams.get('orden');
  return {
    vendors: searchParams.getAll('marca').filter(Boolean),
    inStock: searchParams.get('stock') === '1',
    sort: CATALOG_SORTS.some((s) => s.id === orden) ? orden : 'relevancia',
  };
}

/**
 * Catalog for the whole store (home page and /collections/all).
 * @param {{context: LoaderContext; request: Request}}
 */
export async function loadStoreCatalog({context, request}) {
  const {storefront, customerAccount} = context;
  const params = getCatalogParams(request);

  const [isLoggedIn, {products}, nav] = await Promise.all([
    customerAccount.isLoggedIn(),
    storefront.query(CATALOG_PRODUCTS_QUERY, {
      variables: {
        ...getPaginationVariables(request, {pageBy: CATALOG_PAGE_SIZE}),
        ...productsSearchVariables(params),
      },
    }),
    loadCatalogNav(storefront),
  ]);

  return {
    isLoggedIn,
    catalog: {
      handle: 'all',
      title: 'Todo el catálogo',
      description: null,
      params,
      collections: nav.collections,
      vendors: nav.vendors,
      products: isLoggedIn ? products : redactProductPrices(products),
    },
  };
}

/**
 * Catalog for a single collection (category).
 * @param {{context: LoaderContext; request: Request; handle: string}}
 */
export async function loadCollectionCatalog({context, request, handle}) {
  const {storefront, customerAccount} = context;
  const params = getCatalogParams(request);

  const [isLoggedIn, {collection}, nav] = await Promise.all([
    customerAccount.isLoggedIn(),
    storefront.query(CATALOG_COLLECTION_QUERY, {
      variables: {
        handle,
        ...getPaginationVariables(request, {pageBy: CATALOG_PAGE_SIZE}),
        ...collectionFilterVariables(params),
      },
    }),
    loadCatalogNav(storefront),
  ]);

  if (!collection) return {isLoggedIn, collection: null, catalog: null};

  // Vendor facet with counts, straight from the collection's filters.
  const vendorFacet = collection.products.filters.find(
    (filter) => filter.id === 'filter.p.vendor',
  );
  const vendors = vendorFacet
    ? vendorFacet.values.map((value) => ({
        name: value.label,
        count: value.count,
      }))
    : nav.vendors;

  const products = {
    nodes: collection.products.nodes,
    pageInfo: collection.products.pageInfo,
  };

  return {
    isLoggedIn,
    collection,
    catalog: {
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
      params,
      collections: nav.collections,
      vendors,
      products: isLoggedIn ? products : redactProductPrices(products),
    },
  };
}

/**
 * Sidebar data: categories (collections) and the vendor list.
 * @param {LoaderContext['storefront']} storefront
 */
async function loadCatalogNav(storefront) {
  const {collections, products} = await storefront.query(CATALOG_NAV_QUERY, {
    cache: storefront.CacheLong(),
  });

  const counts = new Map();
  for (const {vendor} of products.nodes) {
    if (vendor) counts.set(vendor, (counts.get(vendor) ?? 0) + 1);
  }
  const vendors = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => ({name, count: null}));

  return {collections: collections.nodes, vendors};
}

/** @param {CatalogParams} params */
function productsSearchVariables({vendors, inStock, sort}) {
  const terms = [];
  if (vendors.length) {
    terms.push(
      `(${vendors.map((v) => `vendor:"${v.replace(/"/g, '\\"')}"`).join(' OR ')})`,
    );
  }
  if (inStock) terms.push('available_for_sale:true');

  return {
    query: terms.length ? terms.join(' AND ') : null,
    sortKey:
      sort === 'nombre'
        ? 'TITLE'
        : sort === 'novedades'
          ? 'CREATED_AT'
          : 'BEST_SELLING',
    reverse: sort === 'novedades',
  };
}

/** @param {CatalogParams} params */
function collectionFilterVariables({vendors, inStock, sort}) {
  return {
    filters: [
      ...vendors.map((productVendor) => ({productVendor})),
      ...(inStock ? [{available: true}] : []),
    ],
    sortKey:
      sort === 'nombre'
        ? 'TITLE'
        : sort === 'novedades'
          ? 'CREATED'
          : 'COLLECTION_DEFAULT',
    reverse: sort === 'novedades',
  };
}

/**
 * Everything a catalog card needs. The variant carries the fields the
 * optimistic cart reads (`product`, `selectedOptions`, `image`, `price`).
 */
export const CATALOG_PRODUCT_FRAGMENT = `#graphql
  fragment CatalogProduct on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      sku
      title
      availableForSale
      image {
        id
        altText
        url
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
`;

const CATALOG_PRODUCTS_QUERY = `#graphql
  query CatalogProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...CatalogProduct
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${CATALOG_PRODUCT_FRAGMENT}
`;

const CATALOG_COLLECTION_QUERY = `#graphql
  query CatalogCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        filters {
          id
          values {
            label
            count
          }
        }
        nodes {
          ...CatalogProduct
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${CATALOG_PRODUCT_FRAGMENT}
`;

const CATALOG_NAV_QUERY = `#graphql
  query CatalogNav($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 12, sortKey: TITLE) {
      nodes {
        id
        handle
        title
      }
    }
    products(first: 250) {
      nodes {
        vendor
      }
    }
  }
`;

/**
 * @typedef {{
 *   vendors: string[];
 *   inStock: boolean;
 *   sort: string;
 * }} CatalogParams
 */

/** @typedef {import('react-router').LoaderFunctionArgs['context']} LoaderContext */
