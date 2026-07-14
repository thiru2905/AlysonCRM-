import { toast as sonner } from "sonner";

type ToastTone = "default" | "success" | "error" | "info";

/**
 * Compatibility wrapper matching the Alyson Recruiter `toast(title, opts)`
 * signature, backed by the OS's sonner Toaster (mounted once in __root).
 */
export function toast(
  title: string,
  opts?: { description?: string; tone?: ToastTone }
) {
  const options = opts?.description ? { description: opts.description } : undefined;
  switch (opts?.tone) {
    case "success":
      return sonner.success(title, options);
    case "error":
      return sonner.error(title, options);
    case "info":
      return sonner.info(title, options);
    default:
      return sonner(title, options);
  }
}
