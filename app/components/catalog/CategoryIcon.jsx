import {
  Barcode,
  DeviceMobile,
  Package,
  Printer,
  Receipt,
  SquaresFour,
  Tag,
} from '~/components/Icons';

/**
 * Picks an icon for a collection or product type from its name, so new
 * Shopify collections get a sensible icon without code changes.
 */
const MATCHERS = [
  [/lector|scanner|esc[aá]ner|c[oó]digo/i, Barcode],
  [/pos|boleta|recibo|receipt|t[eé]rmica de 80/i, Receipt],
  [/impresora|etiquetad|printer/i, Printer],
  [/m[oó]vil|terminal|mobile|pda|colector/i, DeviceMobile],
  [/insumo|etiqueta|ribbon|rollo|label/i, Tag],
  [/todo|all|cat[aá]logo/i, SquaresFour],
];

/**
 * @param {{name?: string | null; size?: number; className?: string}}
 */
export function CategoryIcon({name, size = 17, className}) {
  const Icon =
    MATCHERS.find(([pattern]) => pattern.test(name ?? ''))?.[1] ?? Package;
  return <Icon size={size} className={className} />;
}
