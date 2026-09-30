import {redirect, useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {loadCollectionCatalog} from '~/lib/catalog';
import {Catalog} from '~/components/catalog/Catalog';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const collection = data?.collection;
  return [
    {title: `EST SA | ${collection?.seo?.title || collection?.title || ''}`},
    {
      name: 'description',
      content: collection?.seo?.description || collection?.description || '',
    },
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader({context, params, request}) {
  const {handle} = params;

  if (!handle) {
    throw redirect('/collections');
  }

  const {isLoggedIn, collection, catalog} = await loadCollectionCatalog({
    context,
    request,
    handle,
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {isLoggedIn, collection, catalog};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection, catalog, isLoggedIn} = useLoaderData();

  return (
    <div className="collection pt-8">
      <Catalog catalog={catalog} isLoggedIn={isLoggedIn} />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

/** @typedef {import('./+types/($locale).collections.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
