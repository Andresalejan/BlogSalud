import type { RefObject } from "react"

/**
 * Tarjeta de login para el panel admin.
 *
 * Recibe el estado controlado (username/password) y refs a los inputs.
 * Usamos `ref` porque algunos navegadores autocompletan credenciales sin
 * disparar `onChange`; así podemos leer el valor real del DOM cuando haga falta.
 */
type Props = {
  username: string
  setUsername: (v: string) => void
  password: string
  setPassword: (v: string) => void
  usernameInputRef: RefObject<HTMLInputElement>
  passwordInputRef: RefObject<HTMLInputElement>
  busy: boolean
  error: string | null
  doLogin: () => Promise<void>
}

export const AdminLoginCard = (props: Props) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-title text-2xl mb-2">Acceso</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Ingresa las credenciales para habilitar la publicación.
      </p>

      <label className="block text-sm font-semibold mb-2">Usuario</label>
      <input
        className="w-full rounded-xl border border-neutral-200 px-4 py-3"
        type="text"
        name="username"
        autoComplete="username"
        ref={props.usernameInputRef}
        value={props.username}
        onChange={(e) => props.setUsername(e.target.value)}
        placeholder="admin"
      />

      <label className="block text-sm font-semibold mb-2">Contraseña</label>
      <input
        className="w-full rounded-xl border border-neutral-200 px-4 py-3"
        type="password"
        name="password"
        autoComplete="current-password"
        ref={props.passwordInputRef}
        value={props.password}
        onChange={(e) => props.setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return
          if (props.busy) return
          const effectiveUser =
            props.username.trim() || props.usernameInputRef.current?.value?.trim() || ""
          const effectivePass =
            props.password.trim() || props.passwordInputRef.current?.value?.trim() || ""
          if (!effectiveUser || !effectivePass) return
          e.preventDefault()
          void props.doLogin()
        }}
        placeholder="••••••••"
      />

      <button
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        onClick={props.doLogin}
        disabled={
          props.busy ||
          !(props.username.trim() || props.usernameInputRef.current?.value?.trim()) ||
          !(props.password.trim() || props.passwordInputRef.current?.value?.trim())
        }
      >
        {props.busy ? "Ingresando…" : "Ingresar"}
      </button>

      {props.error ? <p className="mt-3 text-sm text-red-600">{props.error}</p> : null}
    </div>
  )
}
