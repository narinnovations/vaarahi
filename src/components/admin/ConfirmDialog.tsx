import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Options = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

/**
 * Imperative confirmation dialog. Returns a Promise<boolean>.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete?", variant: "danger" })) { ... }
 */
export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; opts: Options }>({
    open: false,
    opts: {},
  });
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: Options = {}) => {
    setState({ open: true, opts });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const done = (v: boolean) => {
    resolverRef.current?.(v);
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
  };

  const dialog = (
    <AlertDialog open={state.open} onOpenChange={(o) => !o && done(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.opts.title ?? "Are you sure?"}</AlertDialogTitle>
          {state.opts.description && (
            <AlertDialogDescription>{state.opts.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => done(false)}>
            {state.opts.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => done(true)}
            className={
              state.opts.variant === "danger"
                ? "bg-ruby text-white hover:bg-ruby/90"
                : undefined
            }
          >
            {state.opts.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
