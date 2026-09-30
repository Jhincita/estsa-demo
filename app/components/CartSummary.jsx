import {CartForm} from '@shopify/hydrogen';
import {useId} from 'react';
import {IVA_RATE, MIN_ORDER_AMOUNT, formatMoney} from '~/lib/b2b';
import {X} from '~/components/Icons';

/**
 * Order totals: progress to the minimum order, net subtotal, IVA and the
 * checkout ("Emitir orden de compra") action.
 * @param {CartSummaryProps}
 */
export function CartSummary({cart, layout}) {
  const summaryId = useId();
  const subtotal = cart?.cost?.subtotalAmount;
  const net = Number(subtotal?.amount ?? 0);
  const belowMinimum = net < MIN_ORDER_AMOUNT;
  const progress = Math.min(100, (net / MIN_ORDER_AMOUNT) * 100);
  const currencyCode = subtotal?.currencyCode ?? 'CLP';
  const money = {amount: 0, currencyCode};

  return (
    <div
      aria-labelledby={summaryId}
      className={`flex flex-col gap-2.5 bg-neutral-900 px-5.5 pt-4.5 pb-5.5 ${
        layout === 'page' ? 'rounded-lg lg:sticky lg:top-24' : ''
      }`}
    >
      <h4 id={summaryId} className="sr-only">
        Resumen
      </h4>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-400">
          {belowMinimum
            ? `Faltan ${formatMoney(money, MIN_ORDER_AMOUNT - net)} neto para el pedido mínimo`
            : 'Pedido mínimo alcanzado · despacho sin costo en RM'}
        </span>
        <span className="h-1 overflow-hidden rounded bg-neutral-800">
          <span
            className="block h-full bg-accent-500 transition-[width] duration-400"
            style={{width: `${progress}%`}}
          />
        </span>
      </div>

      <CartDiscounts discountCodes={cart?.discountCodes} />

      <dl className="mt-1.5 flex flex-col gap-1.5">
        <Row label="Subtotal neto" value={formatMoney(subtotal)} />
        <Row
          label={`IVA ${Math.round(IVA_RATE * 100)}%`}
          value={formatMoney(money, net * IVA_RATE)}
        />
        <div className="flex justify-between text-[17px] font-medium">
          <dt>Total</dt>
          <dd className="tabular-nums">
            {formatMoney(money, net * (1 + IVA_RATE))}
          </dd>
        </div>
      </dl>

      {cart?.checkoutUrl ? (
        belowMinimum ? (
          <button
            type="button"
            className="btn btn-brand btn-lg mt-1.5"
            disabled
          >
            Emitir orden de compra
          </button>
        ) : (
          <a
            href={cart.checkoutUrl}
            target="_self"
            className="btn btn-brand btn-lg mt-1.5"
          >
            Emitir orden de compra
          </a>
        )
      ) : null}
    </div>
  );
}

/** @param {{label: string; value: string}} */
function Row({label, value}) {
  return (
    <div className="flex justify-between text-[13px] text-neutral-400">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: CartApiQueryFragment['discountCodes'];
 * }}
 */
function CartDiscounts({discountCodes}) {
  const inputId = useId();
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <section aria-label="Códigos de descuento" className="mt-1">
      {codes.length ? (
        <UpdateDiscountForm>
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
            Descuento
            <span className="tag tag-accent">{codes.join(', ')}</span>
            <button
              type="submit"
              aria-label="Quitar descuento"
              className="grid size-6 place-items-center rounded-md border-0 bg-transparent text-neutral-500 hover:text-neutral-300"
            >
              <X size={13} />
            </button>
          </div>
        </UpdateDiscountForm>
      ) : null}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Código de descuento
          </label>
          <input
            id={inputId}
            className="input min-h-9 bg-bg"
            type="text"
            name="discountCode"
            placeholder="Código de descuento"
          />
          <button type="submit" className="btn btn-secondary min-h-9">
            Aplicar
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

/**
 * @typedef {{
 *   cart: OptimisticCart<CartApiQueryFragment | null>;
 *   layout: CartLayout;
 * }} CartSummaryProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCart} OptimisticCart */
