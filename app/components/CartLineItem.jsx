import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';
import {formatMoney} from '~/lib/b2b';
import {Minus, Package, Plus, Trash} from '~/components/Icons';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 * @param {{
 *   layout: CartLayout;
 *   line: CartLine;
 *   childrenMap: LineItemChildrenMap;
 * }}
 */
export function CartLineItem({layout, line, childrenMap}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;
  const variantTitle = title && title !== 'Default Title' ? title : null;

  return (
    <li key={id} className="cart-line fade-rule-bottom py-3.5">
      <div className="flex gap-3">
        <span className="grid size-[52px] flex-none place-items-center overflow-hidden rounded-[10px] bg-neutral-900 text-neutral-600">
          {image ? (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={52}
              width={52}
              loading="lazy"
              className="size-full object-contain"
            />
          ) : (
            <Package size={24} />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            prefetch="intent"
            to={lineItemUrl}
            className="text-sm leading-[1.3] text-text hover:text-accent-200"
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
          >
            {product.title}
          </Link>
          <span className="text-[11px] text-neutral-500">
            {[merchandise.sku, variantTitle].filter(Boolean).join(' · ')}
            {line.cost?.amountPerQuantity ? (
              <>
                {merchandise.sku || variantTitle ? ' · ' : ''}
                {formatMoney(line.cost.amountPerQuantity)} c/u
              </>
            ) : null}
          </span>
          <div className="mt-0.5 flex items-center justify-between">
            <CartLineQuantity line={line} />
            <span className="text-sm font-medium tabular-nums">
              {line.cost?.totalAmount
                ? formatMoney(line.cost.totalAmount)
                : null}
            </span>
          </div>
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Productos incluidos con {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="pl-8">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));
  const stepButton =
    'grid size-[26px] place-items-center rounded-md border-0 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40';

  return (
    <div className="flex items-center gap-0.5">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          aria-label="Disminuir cantidad"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
          className={stepButton}
        >
          <Minus size={13} />
        </button>
      </CartLineUpdateButton>
      <span className="min-w-[30px] text-center text-[13px] tabular-nums">
        {quantity}
      </span>
      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          aria-label="Aumentar cantidad"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
          className={stepButton}
        >
          <Plus size={13} />
        </button>
      </CartLineUpdateButton>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 * @param {{
 *   lineIds: string[];
 *   disabled: boolean;
 * }}
 */
function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        disabled={disabled}
        type="submit"
        aria-label="Quitar de la orden"
        className="ml-1 grid size-[26px] place-items-center rounded-md border-0 bg-transparent text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 disabled:opacity-40"
      >
        <Trash size={14} />
      </button>
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @returns
 * @param {string[]} lineIds - line ids affected by the update
 */
function getUpdateKey(lineIds) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}

/** @typedef {OptimisticCartLine<CartApiQueryFragment>} CartLine */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('~/components/CartMain').LineItemChildrenMap} LineItemChildrenMap */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLine} OptimisticCartLine */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').CartLineFragment} CartLineFragment */
