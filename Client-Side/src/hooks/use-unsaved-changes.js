import { useEffect } from "react";

/**
 * Warn before the browser unloads (close tab / refresh / external nav)
 * while a form has unsaved changes.
 *
 * The app uses BrowserRouter (no data router), so in-app navigation can't be
 * blocked centrally — editors keep confirming on their own Cancel/Back
 * buttons. This hook covers the destructive cases the buttons can't.
 *
 *   const { isDirty } = useProductForm();
 *   useUnsavedChanges(isDirty);
 */
export default function useUnsavedChanges(isDirty) {
  useEffect(() => {
    if (!isDirty) return undefined;

    const onBeforeUnload = (event) => {
      event.preventDefault();
      // Chrome requires returnValue to be set for the native prompt to show.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
