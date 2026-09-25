import {CartForm} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {Barcode, CheckCircle, Plus} from '~/components/Icons';

/**
 * Add-to-cart button with the "barcode read" feedback from the design:
 * idle → Leyendo… (scan sweep while the request runs) → Agregado.
 * @param {{
 *   lines: Array<OptimisticCartLineInput>;
 *   className?: string;
 *   label?: string;
 *   disabled?: boolean;
 *   onAdded?: () => void;
 * }}
 */
export function ScanAddToCart({
  lines,
  className = '',
  label = 'Agregar',
  disabled,
  onAdded,
}) {
  // CartForm renders its own <form>, so layout classes go on a wrapper.
  return (
    <div className={className}>
      <CartForm
        route="/cart"
        inputs={{lines}}
        action={CartForm.ACTIONS.LinesAdd}
        fetcherKey={`add-${lines[0]?.merchandiseId}`}
      >
        {(fetcher) => (
          <ScanButton
            fetcher={fetcher}
            label={label}
            disabled={disabled}
            onAdded={onAdded}
          />
        )}
      </CartForm>
    </div>
  );
}

/**
 * @param {{
 *   fetcher: FetcherWithComponents<unknown>;
 *   label: string;
 *   disabled?: boolean;
 *   onAdded?: () => void;
 * }}
 */
function ScanButton({fetcher, label, disabled, onAdded}) {
  const busy = fetcher.state !== 'idle';
  const [done, setDone] = useState(false);
  const wasBusy = useRef(false);

  useEffect(() => {
    if (busy) {
      wasBusy.current = true;
      return;
    }
    if (!wasBusy.current) return;
    wasBusy.current = false;
    if (fetcher.data?.errors?.length) return;
    setDone(true);
    onAdded?.();
    const timer = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(timer);
  }, [busy, fetcher.data, onAdded]);

  return (
    <button
      type="submit"
      disabled={disabled || busy}
      className={`relative flex h-[38px] w-full items-center justify-center gap-2 overflow-hidden rounded-md border px-3 text-sm font-medium text-neutral-100 transition-[background,filter] duration-200 hover:brightness-110 disabled:cursor-default ${
        done ? 'border-success bg-success' : 'border-brand bg-brand'
      }`}
    >
      {busy ? (
        <>
          <Barcode size={16} />
          Leyendo…
          <span className="motion-decor absolute inset-y-0 w-[18%] animate-btn-scan bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-accent-200)_55%,transparent),transparent)]" />
        </>
      ) : done ? (
        <span className="flex animate-pop-in items-center gap-2">
          <CheckCircle size={17} weight="fill" />
          Agregado
        </span>
      ) : (
        <>
          <Plus size={16} />
          {label}
        </>
      )}
    </button>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
