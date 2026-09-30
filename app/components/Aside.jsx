import {createContext, useContext, useEffect, useState} from 'react';
import {useId} from 'react';
import {X} from '~/components/Icons';

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 * @param {{
 *   children?: React.ReactNode;
 *   type: AsideType;
 *   heading: React.ReactNode;
 *   subheading?: React.ReactNode;
 * }}
 */
export function Aside({children, heading, subheading, type}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
      aria-labelledby={id}
    >
      <button
        className="close-outside"
        onClick={close}
        aria-label="Cerrar"
        tabIndex={-1}
      />
      {/* inert keeps the closed drawer out of the tab order (React 18: string attr) */}
      <aside {...(expanded ? {} : {inert: ''})}>
        <header className="flex items-center justify-between gap-3 px-5.5 py-5">
          <div className="flex flex-col">
            <h3 id={id} className="text-[19px] font-medium">
              {heading}
            </h3>
            {subheading ? (
              <span className="text-xs text-neutral-500">{subheading}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-icon btn-secondary size-8 min-h-8 border-0"
            onClick={close}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </div>
  );
}

const AsideContext = createContext(null);

Aside.Provider = function AsideProvider({children}) {
  const [type, setType] = useState('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}

/** @typedef {'search' | 'cart' | 'mobile' | 'closed'} AsideType */
/**
 * @typedef {{
 *   type: AsideType;
 *   open: (mode: AsideType) => void;
 *   close: () => void;
 * }} AsideContextValue
 */

/** @typedef {import('react').ReactNode} ReactNode */
