import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {formatMoney} from '~/lib/b2b';
import {BellSimple, LockSimple} from '~/components/Icons';
import {CategoryIcon} from '~/components/catalog/CategoryIcon';
import {QuantityStepper} from '~/components/QuantityStepper';
import {ScanAddToCart} from '~/components/ScanAddToCart';
import {useState} from 'react';

/**
 * @param {{
 *   product: CatalogProductFragment;
 *   isLoggedIn: boolean;
 *   index?: number;
 * }}
 */
export function ProductCard({product, isLoggedIn, index = 0}) {
  const url = useVariantUrl(product.handle);
  const variant = product.selectedOrFirstAvailableVariant;
  const image = product.featuredImage ?? variant?.image;
  const inStock = product.availableForSale;
  const specs = (product.tags ?? []).slice(0, 3);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg bg-surface shadow-sm transition-[transform,box-shadow] duration-250 ease-out-soft hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--color-accent-700),0_14px_34px_rgba(0,0,0,.45)]">
      <Link
        to={url}
        prefetch="intent"
        className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_20%,color-mix(in_srgb,var(--color-neutral-800)_70%,var(--color-surface)),var(--color-surface))]"
        aria-label={product.title}
      >
        {image ? (
          <Image
            data={image}
            alt={image.altText || product.title}
            aspectRatio="4/3"
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
            loading={index < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <CategoryIcon
            name={product.productType}
            size={64}
            className="text-neutral-700"
          />
        )}
        {/* scanner sweep on hover */}
        <span className="motion-decor pointer-events-none absolute inset-2.5 hidden rounded-[10px] border border-accent-400/40 group-hover:block group-hover:animate-fade-in" />
        <span className="motion-decor pointer-events-none absolute inset-x-[8%] hidden h-0.5 bg-accent-400 shadow-[0_0_8px_2px_color-mix(in_srgb,var(--color-accent-500)_70%,transparent)] group-hover:block group-hover:animate-laser-sweep" />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[.1em] text-accent-300">
            {product.vendor}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span
              className={`size-1.5 rounded-full ${inStock ? 'bg-success-dot' : 'bg-neutral-600'}`}
            />
            {inStock ? 'En stock' : 'Sin stock'}
          </span>
        </div>
        <h3 className="m-0 text-base leading-[1.3] tracking-[-.01em] text-pretty">
          <Link
            to={url}
            prefetch="intent"
            className="text-text hover:text-accent-200"
          >
            {product.title}
          </Link>
        </h3>
        {variant?.sku ? (
          <span className="text-xs tabular-nums text-neutral-500">
            SKU {variant.sku}
          </span>
        ) : null}
        {specs.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {specs.map((spec) => (
              <span key={spec} className="tag tag-neutral">
                {spec}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {isLoggedIn && variant?.price ? (
        <CardBuyBox
          variant={variant}
          inStock={inStock}
          url={url}
          delay={index * 45}
        />
      ) : (
        <LockedPrice />
      )}
    </article>
  );
}

function LockedPrice() {
  return (
    <div className="mx-4 mt-3.5 mb-4 flex items-center justify-between gap-1.5 rounded-md bg-neutral-900 py-2.5 pr-1.5 pl-3">
      <span className="flex min-w-0 flex-col gap-px">
        <span className="text-[11px] whitespace-nowrap text-neutral-500">
          Precio mayorista
        </span>
        <span
          aria-hidden="true"
          className="select-none text-[17px] font-semibold text-neutral-300 blur-[5px]"
        >
          $888.888
        </span>
      </span>
      <Link to="/account/login" className="btn btn-ghost px-1.5 text-[13px]">
        <LockSimple size={15} />
        Ver precio
      </Link>
    </div>
  );
}

/**
 * @param {{
 *   variant: NonNullable<CatalogProductFragment['selectedOrFirstAvailableVariant']>;
 *   inStock: boolean;
 *   url: string;
 *   delay: number;
 * }}
 */
function CardBuyBox({variant, inStock, url, delay}) {
  const [quantity, setQuantity] = useState(1);
  const {price, compareAtPrice} = variant;

  return (
    <div
      className="flex animate-fade-up flex-col gap-2.5 px-4 pt-3.5 pb-4"
      style={{animationDelay: `${delay}ms`}}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex flex-col">
          <span className="text-xl font-semibold tracking-[-.01em] tabular-nums">
            {formatMoney(price)}
          </span>
          <span className="text-[11px] text-neutral-500">
            neto unitario · + IVA
          </span>
        </span>
        {compareAtPrice ? (
          <s className="text-xs text-neutral-500 tabular-nums">
            {formatMoney(compareAtPrice)}
          </s>
        ) : null}
      </div>
      {inStock ? (
        <div className="flex gap-2">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <ScanAddToCart
            className="flex-1"
            lines={[
              {merchandiseId: variant.id, quantity, selectedVariant: variant},
            ]}
          />
        </div>
      ) : (
        <Link to={url} className="btn btn-secondary h-[38px] min-h-0">
          <BellSimple size={16} />
          Consultar
        </Link>
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').CatalogProductFragment} CatalogProductFragment */
