import {Form, Link, data, useActionData, useNavigation} from 'react-router';
import {isValidRut} from '~/lib/b2b';
import {CheckCircle, Storefront, WarningCircle} from '~/components/Icons';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'EST SA | Solicitar cuenta mayorista'}];
};

const FIELDS = [
  {
    name: 'razonSocial',
    label: 'Razón social',
    placeholder: 'Comercial Andes SpA',
    wide: true,
  },
  {name: 'rut', label: 'RUT empresa', placeholder: '76.543.210-3'},
  {name: 'giro', label: 'Giro', placeholder: 'Venta de equipos'},
  {
    name: 'email',
    label: 'Correo',
    placeholder: 'compras@empresa.cl',
    type: 'email',
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    placeholder: '+56 9 1234 5678',
    type: 'tel',
  },
];

/**
 * Forwards the request to ACCOUNT_REQUEST_WEBHOOK_URL (e.g. a Shopify Flow,
 * Zapier or Make webhook that creates the B2B company and notifies sales).
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const form = await request.formData();
  const values = Object.fromEntries(
    FIELDS.map(({name}) => [name, String(form.get(name) ?? '').trim()]),
  );

  /** @type {Record<string, string>} */
  const errors = {};
  if (!values.razonSocial) errors.razonSocial = 'Ingresa la razón social.';
  if (!isValidRut(values.rut)) errors.rut = 'RUT inválido.';
  if (!values.giro) errors.giro = 'Ingresa el giro.';
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Correo inválido.';
  if (values.telefono.replace(/\D/g, '').length < 8) {
    errors.telefono = 'Teléfono inválido.';
  }
  if (Object.keys(errors).length) {
    return data({ok: false, errors, values}, {status: 400});
  }

  const webhookUrl = context.env.ACCOUNT_REQUEST_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('ACCOUNT_REQUEST_WEBHOOK_URL is not set');
    return data(
      {
        ok: false,
        errors: {
          form: 'No pudimos enviar tu solicitud en este momento. Intenta más tarde o contáctanos directamente.',
        },
        values,
      },
      {status: 503},
    );
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...values, submittedAt: new Date().toISOString()}),
  }).catch((error) => {
    console.error(error);
    return null;
  });

  if (!response?.ok) {
    return data(
      {
        ok: false,
        errors: {form: 'No pudimos enviar tu solicitud. Intenta nuevamente.'},
        values,
      },
      {status: 502},
    );
  }

  return {ok: true, errors: {}, values};
}

export default function RequestAccount() {
  /** @type {ActionReturnData} */
  const result = useActionData();
  const {state} = useNavigation();
  const submitting = state === 'submitting';
  const errors = result?.errors ?? {};

  return (
    <div className="container-site grid place-items-center pt-12 pb-18">
      <div className="flex w-full max-w-[520px] animate-pop-in flex-col gap-4.5 rounded-lg bg-surface p-6.5 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="grid size-[42px] place-items-center rounded-[12px] bg-accent-800 text-accent-200">
            <Storefront size={20} />
          </span>
          <div className="flex flex-col">
            <h1 className="text-[19px] font-medium">
              Solicitar cuenta mayorista
            </h1>
            <span className="text-[13px] text-neutral-400">
              Para distribuidores y revendedores con RUT
            </span>
          </div>
        </div>

        <div className="seg self-stretch">
          <Link to="/account/login" className="seg-opt flex-1">
            Ingresar
          </Link>
          <span className="seg-opt flex-1" aria-current="true">
            Solicitar cuenta
          </span>
        </div>

        {result?.ok ? (
          <div className="flex animate-pop-in items-start gap-3 rounded-md bg-neutral-900 p-4">
            <CheckCircle
              size={22}
              weight="fill"
              className="flex-none text-success-dot"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Solicitud enviada</span>
              <span className="text-[13px] text-neutral-400">
                Te contactaremos a {result.values.email} dentro de 24 h hábiles.
              </span>
            </div>
          </div>
        ) : (
          <Form
            method="post"
            noValidate
            className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3"
          >
            {FIELDS.map((field) => (
              <div
                key={field.name}
                className={`field ${field.wide ? 'col-span-full' : ''}`}
              >
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type ?? 'text'}
                  className="input"
                  placeholder={field.placeholder}
                  defaultValue={result?.values?.[field.name]}
                  aria-invalid={errors[field.name] ? true : undefined}
                  aria-describedby={
                    errors[field.name] ? `${field.name}-error` : undefined
                  }
                  required
                />
                {errors[field.name] ? (
                  <span
                    id={`${field.name}-error`}
                    className="mt-1 block text-xs text-[oklch(0.72_0.16_25)]"
                  >
                    {errors[field.name]}
                  </span>
                ) : null}
              </div>
            ))}
            {errors.form ? (
              <p className="col-span-full flex items-center gap-2 text-[13px] text-[oklch(0.72_0.16_25)]">
                <WarningCircle size={16} />
                {errors.form}
              </p>
            ) : null}
            <button
              type="submit"
              className="btn btn-brand btn-lg col-span-full mt-1.5"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-neutral-100/30 border-t-neutral-100" />
                  Enviando…
                </>
              ) : (
                'Enviar solicitud'
              )}
            </button>
            <span className="col-span-full text-xs text-neutral-500">
              Validamos cada solicitud con el SII. Respuesta en 24 h hábiles.
            </span>
          </Form>
        )}
      </div>
    </div>
  );
}

/** @typedef {import('./+types/($locale).solicitar-cuenta').Route} Route */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
