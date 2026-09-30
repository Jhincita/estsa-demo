/**
 * Wholesale (B2B) rules for the EST SA storefront.
 *
 * Guests browse the catalog without prices: loaders call
 * `redactProductPrices` so price fields aren't rendered or included in
 * page data. This is a presentation rule — the public Storefront API still
 * answers price queries. For price lists that are truly private, assign
 * Shopify B2B catalogs to company locations; those prices are only
 * returned for signed-in company customers.
 */

/** Minimum net order (CLP) before a purchase order can be issued. */
export const MIN_ORDER_AMOUNT = 150000;

/** Chilean VAT. Catalog prices are shown net; IVA is added at checkout. */
export const IVA_RATE = 0.19;

/**
 * @param {{amount: string | number; currencyCode: string} | null | undefined} money
 * @param {number} [amountOverride]
 */
export function formatMoney(money, amountOverride) {
  if (!money) return '';
  const amount = amountOverride ?? Number(money.amount);
  const zeroDecimals = ['CLP', 'JPY', 'KRW', 'COP'].includes(
    money.currencyCode,
  );
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: money.currencyCode,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: zeroDecimals ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : 2,
  }).format(amount);
}

/**
 * Removes every price field from a product-like object (deeply), keeping
 * the rest of the shape intact.
 * @template T
 * @param {T} product
 * @return {T}
 */
export function redactProductPrices(product) {
  return JSON.parse(JSON.stringify(product), (key, value) =>
    PRICE_KEYS.has(key) ? null : value,
  );
}

const PRICE_KEYS = new Set([
  'price',
  'compareAtPrice',
  'unitPrice',
  'priceRange',
  'compareAtPriceRange',
  'minVariantPrice',
  'maxVariantPrice',
]);

/**
 * Validates a Chilean RUT (e.g. "76.543.210-K") with its check digit.
 * @param {string} rut
 */
export function isValidRut(rut) {
  const clean = String(rut)
    .replace(/[.\s-]/g, '')
    .toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  const expected = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
  return dv === expected;
}
