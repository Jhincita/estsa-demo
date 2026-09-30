import {Link, useLoaderData} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {formatMoney, redactProductPrices} from '~/lib/b2b';
import {LockSimple} from '~/components/Icons';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [
    {title: `EST SA | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}, isLoggedIn] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    context.customerAccount.isLoggedIn(),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    // Wholesale prices are only sent to signed-in customers.
    product: isLoggedIn ? product : redactProductPrices(product),
    isLoggedIn,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, isLoggedIn} = useLoaderData();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, vendor, descriptionHtml} = product;
  const inStock = Boolean(selectedVariant?.availableForSale);

  return (
    <div className="product container-site grid gap-10 pt-8 pb-18 md:grid-cols-2 md:gap-14">
      <ProductImage image={selectedVariant?.image} title={title} />
      <div className="product-main flex flex-col gap-5 self-start md:sticky md:top-24">
        <nav className="text-[13px] text-neutral-500" aria-label="Migas">
          <Link to="/collections/all" className="text-neutral-400">
            Catálogo
          </Link>
          <span className="mx-2">/</span>
          <span>{vendor}</span>
        </nav>
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[.1em] text-accent-300 uppercase">
            {vendor}
          </span>
          <h1 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] tracking-[-.02em] text-balance">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-400">
            {selectedVariant?.sku ? (
              <span className="tabular-nums">SKU {selectedVariant.sku}</span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${inStock ? 'bg-success-dot' : 'bg-neutral-600'}`}
              />
              {inStock ? 'En stock' : 'Sin stock'}
            </span>
          </div>
        </div>

        <PriceBox variant={selectedVariant} isLoggedIn={isLoggedIn} />

        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
          isLoggedIn={isLoggedIn}
        />

        {descriptionHtml ? (
          <div className="fade-rule-top pt-5">
            <span className="kicker mb-3">Descripción</span>
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{__html: descriptionHtml}}
            />
          </div>
        ) : null}
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price?.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

/**
 * @param {{
 *   variant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   isLoggedIn: boolean;
 * }}
 */
function PriceBox({variant, isLoggedIn}) {
  if (!isLoggedIn || !variant?.price) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-900 px-4 py-3">
        <span className="flex flex-col gap-px">
          <span className="text-[11px] text-neutral-500">Precio mayorista</span>
          <span
            aria-hidden="true"
            className="select-none text-2xl font-semibold text-neutral-300 blur-[6px]"
          >
            $888.888
          </span>
        </span>
        <Link to="/account/login" className="btn btn-ghost">
          <LockSimple size={15} />
          Ver precio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-up items-baseline gap-3">
      <span className="text-[28px] font-semibold tracking-[-.01em] tabular-nums">
        {formatMoney(variant.price)}
      </span>
      {variant.compareAtPrice ? (
        <s className="text-sm text-neutral-500 tabular-nums">
          {formatMoney(variant.compareAtPrice)}
        </s>
      ) : null}
      <span className="text-xs text-neutral-500">neto unitario · + IVA</span>
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('./+types/($locale).products.$handle').Route} Route */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
