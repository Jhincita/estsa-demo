import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import {ArrowRight} from '~/components/Icons';
import {CategoryIcon} from '~/components/catalog/CategoryIcon';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

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
async function loadCriticalData({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collections() {
  /** @type {LoaderReturnData} */
  const {collections} = useLoaderData();

  return (
    <div className="collections container-site page-default">
      <span className="kicker">Catálogo</span>
      <h1 className="mt-2">Categorías</h1>
      <PaginatedResourceSection
        connection={collections}
        resourcesClassName="collections-grid"
      >
        {({node: collection, index}) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

/**
 * @param {{
 *   collection: CollectionFragment;
 *   index: number;
 * }}
 */
function CollectionItem({collection, index}) {
  return (
    <Link
      className="collection-item group flex flex-col overflow-hidden rounded-lg bg-surface text-text shadow-sm transition-[transform,box-shadow] duration-250 hover:-translate-y-[3px] hover:text-text hover:shadow-[0_0_0_1px_var(--color-accent-700),0_14px_34px_rgba(0,0,0,.45)]"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(120%_90%_at_50%_20%,color-mix(in_srgb,var(--color-neutral-800)_70%,var(--color-surface)),var(--color-surface))]">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            aspectRatio="4/3"
            data={collection.image}
            loading={index < 3 ? 'eager' : undefined}
            sizes="(min-width: 45em) 400px, 100vw"
            className="h-full w-full rounded-none object-cover"
          />
        ) : (
          <CategoryIcon
            name={collection.title}
            size={56}
            className="text-neutral-700"
          />
        )}
      </div>
      <span className="flex items-center justify-between gap-2 px-4 py-3.5 text-base font-medium">
        {collection.title}
        <ArrowRight size={16} className="text-accent-300" />
      </span>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('./+types/collections._index').Route} Route */
/** @typedef {import('storefrontapi.generated').CollectionFragment} CollectionFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
