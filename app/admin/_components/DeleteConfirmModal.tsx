type Props = {
  deleteTarget: { slug: string; title: string }
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Modal de confirmación para eliminar un artículo.
 *
 * Se bloquea con `busy` para evitar doble submit o cierre accidental
 * mientras el request está en curso.
 */
export const DeleteConfirmModal = (props: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-neutral-900/30"
        onClick={() => (props.busy ? null : props.onCancel())}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6">
        <h3 className="font-title text-xl mb-2">Confirmar eliminación</h3>
        <p className="text-sm text-neutral-700">
          ¿Eliminar “{props.deleteTarget.title}”? Esta acción creará un commit que borra el archivo.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={props.onCancel}
            disabled={props.busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={props.onConfirm}
            disabled={props.busy}
          >
            {props.busy ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}
