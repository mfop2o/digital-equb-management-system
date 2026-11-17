/**
 * Read a text field from `FormData` without unsafe coercion.
 *
 * `FormData#get` can return a `File`, so narrowing to the string case keeps
 * query values well-typed instead of falling back to `[object Object]`.
 */
export function formString(value: FormDataEntryValue | null): string {
    return typeof value === 'string' ? value : '';
}
