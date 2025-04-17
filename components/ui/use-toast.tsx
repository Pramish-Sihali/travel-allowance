// hooks/use-toast.ts
import { toast } from 'sonner';

export const useToast = () => {
  return {
    toast,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
  };
};
