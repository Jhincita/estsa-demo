import {useCallback, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {useAside} from './Aside';
import {QuantityStepper} from './QuantityStepper';
import {ScanAddToCart} from './ScanAddToCart';
import {BellSimple, LockSimple} from './Icons';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   isLoggedIn: boolean;
 * }}
 */
export function ProductForm({productOptions, selectedVariant, isLoggedIn}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const openCart = useCallback(() => open('cart'), [open]);
  const optionClass = (available) =>
    `seg-opt rounded-md border border-divider ${available ? '' : 'opacity-40'}`;

  return (
    <div className="product-form flex flex-col gap-5">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <span className="kicker mb-2">{option.name}</span>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className={optionClass(available)}
                      aria-current={selected ? 'true' : undefined}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={optionClass(available)}
                      aria-pressed={selected}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      {!isLoggedIn ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-neutral-900 p-3.5">
          <LockSimple size={18} className="text-accent-300" />
          <span className="flex-[1_1_200px] text-[13px] text-neutral-400">
            Ingresa con tu cuenta mayorista para ver el precio y comprar.
          </span>
          <Link to="/account/login" className="btn btn-brand">
            Ingresar
          </Link>
        </div>
      ) : selectedVariant?.availableForSale ? (
        <div className="flex gap-2">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <ScanAddToCart
            className="flex-1"
            label="Agregar a la orden"
            onAdded={openCart}
            lines={[
              {merchandiseId: selectedVariant.id, quantity, selectedVariant},
            ]}
          />
        </div>
      ) : (
        <Link to="/solicitar-cuenta" className="btn btn-secondary btn-lg">
          <BellSimple size={16} />
          Sin stock · Consultar disponibilidad
        </Link>
      )}
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="size-5 overflow-hidden rounded-full"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} className="size-full" />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
