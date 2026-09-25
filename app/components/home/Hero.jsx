import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {
  ArrowDown,
  Check,
  IdentificationCard,
  Stack,
  Truck,
} from '~/components/Icons';

/**
 * @param {{
 *   isLoggedIn: boolean;
 *   reads: ScannerRead[];
 *   catalogId: string;
 * }}
 */
export function Hero({isLoggedIn, reads, catalogId}) {
  return (
    <section className="container-site flex flex-wrap items-center gap-12 pt-14 pb-9">
      <div className="flex max-w-[640px] flex-[1_1_440px] flex-col gap-5">
        <span className="inline-flex items-center gap-2 text-xs tracking-[.08em] text-accent-300 uppercase">
          <span className="h-px w-[18px] bg-accent-400" />
          Canal mayorista · Chile
        </span>
        <h1 className="m-0 text-[clamp(34px,4.6vw,56px)] leading-[1.04] tracking-[-.03em] text-balance">
          Captura, etiquetado y punto de venta para quienes revenden.
        </h1>
        <p className="m-0 max-w-[520px] text-[17px] leading-[1.55] text-pretty text-neutral-400">
          Lectores, impresoras térmicas, terminales móviles e insumos de Zebra,
          Honeywell, Datalogic y más. Explora el catálogo completo; los precios
          de lista y la compra se habilitan con tu cuenta de distribuidor.
        </p>
        <div className="mt-1 flex flex-wrap gap-2.5">
          <a href={`#${catalogId}`} className="btn btn-brand btn-lg">
            Ver catálogo
            <ArrowDown size={16} />
          </a>
          {!isLoggedIn ? (
            <Link to="/account/login" className="btn btn-outline btn-lg">
              Ya tengo cuenta
            </Link>
          ) : null}
        </div>
        <div className="mt-4.5 flex flex-wrap gap-x-7 gap-y-2.5 text-[13px] text-neutral-400">
          <Perk icon={IdentificationCard}>Validación por RUT empresa</Perk>
          <Perk icon={Stack}>Precios por volumen</Perk>
          <Perk icon={Truck}>Despacho a todo Chile</Perk>
        </div>
      </div>

      <div className="relative ml-auto max-w-[480px] flex-[1_1_360px]">
        <BarcodeScanner reads={reads} />
      </div>
    </section>
  );
}

/**
 * @param {{icon: React.ComponentType<{size?: number; className?: string}>; children: React.ReactNode}}
 */
function Perk({icon: Icon, children}) {
  return (
    <span className="flex items-center gap-2">
      <Icon size={18} className="text-accent-400" />
      {children}
    </span>
  );
}

/** Deterministic bar widths so server and client render the same code. */
const BARS = (() => {
  let seed = 7;
  const bars = [];
  for (let i = 0; i < 64; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const width = 1 + Math.floor((seed / 233280) * 3.2);
    bars.push({width: width * 1.6, ink: i % 2 === 0});
  }
  return bars;
})();

/**
 * The live "reader" card: a label with a laser that re-reads a new product
 * every few seconds.
 * @param {{reads: ScannerRead[]}}
 */
function BarcodeScanner({reads}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reads.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(interval);
  }, [reads.length]);

  const read = reads[tick % reads.length] ?? FALLBACK_READS[0];
  const tail = String(120045 + (tick % 10) * 7331).slice(0, 6);

  return (
    <div className="relative overflow-hidden rounded-lg bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-surface)_90%,var(--color-brand)),var(--color-surface))] p-5.5 shadow-md">
      <div className="mb-4 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-2">
          <span className="size-[7px] animate-blink rounded-full bg-accent-400 shadow-[0_0_10px_var(--color-accent-400)]" />
          Lector activo
        </span>
        <span>ETIQUETA 100 × 50</span>
      </div>

      <div
        className="relative overflow-hidden rounded-md bg-neutral-100 px-5 pt-4.5 pb-3.5 text-bg"
        aria-hidden="true"
      >
        <div className="mb-2.5 flex justify-between text-[11px] font-semibold tracking-[.06em]">
          <span>EST SA</span>
          <span>{read.sku}</span>
        </div>
        <div className="flex h-24 items-stretch">
          {BARS.map((bar, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={bar.ink ? 'bg-bg' : ''}
              style={{flex: `${bar.width} 1 0`}}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[13px] tracking-[.18em] tabular-nums">
          <span>7</span>
          <span>804650</span>
          <span>{tail}</span>
        </div>
        <span className="motion-decor absolute -inset-x-[4%] h-0.5 animate-laser bg-accent-500 shadow-[0_0_8px_2px_color-mix(in_srgb,var(--color-accent-500)_70%,transparent),0_0_24px_6px_color-mix(in_srgb,var(--color-accent-500)_35%,transparent)]" />
        <span
          key={`flash-${tick}`}
          className="motion-decor pointer-events-none absolute inset-0 animate-flash bg-accent-300 mix-blend-multiply"
        />
      </div>

      <div className="mt-4 min-h-[52px]" aria-live="polite">
        <div
          key={`read-${tick}`}
          className="flex animate-pop-in items-center gap-3"
        >
          <span className="relative grid size-[30px] flex-none place-items-center rounded-full bg-accent-800 text-accent-200">
            <span className="motion-decor absolute inset-0 animate-ring rounded-full border border-accent-400" />
            <Check size={15} />
          </span>
          <span className="flex min-w-0 flex-col leading-[1.35]">
            <span className="truncate text-sm font-medium">{read.name}</span>
            <span className="text-xs text-neutral-400 tabular-nums">
              EAN 7 804650 {tail} · leído en 38 ms
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Builds scanner reads from real catalog products, falling back to a few
 * representative items when the catalog is empty.
 * @param {Array<{vendor: string; title: string; selectedOrFirstAvailableVariant?: {sku?: string | null} | null}>} products
 * @return {ScannerRead[]}
 */
export function toScannerReads(products) {
  const reads = products.slice(0, 10).map((product) => ({
    name: `${product.vendor} ${product.title.split(' ').slice(0, 3).join(' ')}`,
    sku: (product.selectedOrFirstAvailableVariant?.sku || product.vendor)
      .split('-')[0]
      .toUpperCase(),
  }));
  return reads.length ? reads : FALLBACK_READS;
}

const FALLBACK_READS = [
  {name: 'Zebra Lector 2D DS2208', sku: 'DS2208'},
  {name: 'Honeywell Voyager 1250g lector', sku: '1250G'},
  {name: 'Zebra Impresora ZD421 térmica', sku: 'ZD4A042'},
  {name: 'Epson TM-T20III impresora', sku: 'C31CH51001'},
];

/** @typedef {{name: string; sku: string}} ScannerRead */
