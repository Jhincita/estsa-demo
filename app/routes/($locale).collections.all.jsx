import {useLoaderData} from 'react-router';
import {loadStoreCatalog} from '~/lib/catalog';
import {Catalog} from '~/components/catalog/Catalog';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'EST SA | Catálogo completo'}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader({context, request}) {
  return loadStoreCatalog({context, request});
}

export default function AllProducts() {
  /** @type {LoaderReturnData} */
  const {catalog, isLoggedIn} = useLoaderData();

  return (
    <div className="pt-8">
      <Catalog catalog={catalog} isLoggedIn={isLoggedIn} />
    </div>
  );
}

/** @typedef {import('./+types/($locale).collections.all').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
