import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {ShoppingCartSimple} from '~/components/Icons';
/**
 * Returns a map of all line items and their children.
 * @param {CartLine[]} lines
 * @return {LineItemChildrenMap}
 */
function getLineItemChildrenMap(lines) {
  const children = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 * @param {CartMainProps}
 */
export function CartMain({layout, cart: originalCart}) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  return (
    <section
      className={
        layout === 'aside'
          ? 'flex min-h-0 flex-1 flex-col'
          : 'grid items-start gap-8 lg:grid-cols-[1fr_400px]'
      }
      aria-label={layout === 'page' ? 'Orden de compra' : 'Carro'}
    >
      <CartEmpty hidden={linesCount} layout={layout} />
      <div
        className={
          layout === 'aside' ? 'min-h-0 flex-1 overflow-y-auto px-5.5' : ''
        }
        hidden={!linesCount}
      >
        <p id="cart-lines" className="sr-only">
          Productos
        </p>
        <div>
          <ul aria-labelledby="cart-lines" className="flex flex-col">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
      </div>
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </section>
  );
}

/**
 * @param {{
 *   hidden: boolean;
 *   layout?: CartMainProps['layout'];
 * }}
 */
function CartEmpty({hidden = false, layout}) {
  const {close} = useAside();
  return (
    <div
      hidden={hidden}
      className={`flex flex-col gap-2 py-10 text-neutral-400 ${layout === 'aside' ? 'px-5.5' : ''}`}
    >
      <ShoppingCartSimple size={30} className="text-neutral-600" />
      Tu orden está vacía.
      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="btn btn-ghost self-start"
      >
        Ir al catálogo →
      </Link>
    </div>
  );
}

/** @typedef {'page' | 'aside'} CartLayout */
/**
 * @typedef {{
 *   cart: CartApiQueryFragment | null;
 *   layout: CartLayout;
 * }} CartMainProps
 */
/** @typedef {{[parentId: string]: CartLine[]}} LineItemChildrenMap */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartLineItem').CartLine} CartLine */
