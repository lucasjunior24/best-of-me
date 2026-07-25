import toast from 'react-hot-toast';
import { IToastService } from '../../core/ports/IToastService';

export class HotToastService implements IToastService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  info(message: string): void {
    toast(message, { icon: 'ℹ️' });
  }
}
