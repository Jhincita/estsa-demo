import {Minus, Plus} from '~/components/Icons';

/**
 * Quantity input for wholesale orders. Steps by 1 up to 10, then by 5.
 * @param {{
 *   value: number;
 *   onChange: (value: number) => void;
 *   min?: number;
 *   size?: 'md' | 'sm';
 * }}
 */
export function QuantityStepper({value, onChange, min = 1, size = 'md'}) {
  const height = size === 'sm' ? 'h-[30px]' : 'h-[38px]';
  const button = `grid w-8 ${height} place-items-center border-0 bg-transparent text-neutral-300 hover:bg-text/7 disabled:opacity-35`;

  return (
    <div
      className="flex items-center rounded-md shadow-[inset_0_0_0_1px_var(--color-divider)]"
      role="group"
      aria-label="Cantidad"
    >
      <button
        type="button"
        aria-label="Menos"
        className={`${button} rounded-l-md`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - (value > 10 ? 5 : 1)))}
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[30px] text-center text-sm tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Más"
        className={`${button} rounded-r-md`}
        onClick={() => onChange(value + (value >= 10 ? 5 : 1))}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
