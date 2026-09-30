import {Image} from '@shopify/hydrogen';
import {Package} from '~/components/Icons';

/**
 * @param {{
 *   image: ProductVariantFragment['image'];
 *   title?: string;
 * }}
 */
export function ProductImage({image, title}) {
  return (
    <div className="product-image group relative grid aspect-square place-items-center self-start overflow-hidden rounded-lg bg-[radial-gradient(120%_90%_at_50%_20%,color-mix(in_srgb,var(--color-neutral-800)_70%,var(--color-surface)),var(--color-surface))] shadow-sm">
      {image ? (
        <Image
          alt={image.altText || title || 'Imagen del producto'}
          aspectRatio="1/1"
          data={image}
          key={image.id}
          sizes="(min-width: 45em) 50vw, 100vw"
          className="h-full w-full object-contain p-8"
        />
      ) : (
        <Package size={96} className="text-neutral-700" />
      )}
      <span className="motion-decor pointer-events-none absolute inset-3 hidden rounded-[12px] border border-accent-400/40 group-hover:block group-hover:animate-fade-in" />
      <span className="motion-decor pointer-events-none absolute inset-x-[8%] hidden h-0.5 bg-accent-400 shadow-[0_0_8px_2px_color-mix(in_srgb,var(--color-accent-500)_70%,transparent)] group-hover:block group-hover:animate-laser-sweep" />
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
