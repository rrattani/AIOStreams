import { toast, ToastOptions } from 'react-toastify';

export const toastOptions: ToastOptions = {
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: 'touch',
  style: {
    borderRadius: '8px',
    backgroundColor: '#ededed',
    color: 'black',
  },
};

function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  id?: string
) {
  toast[type](message, {
    ...toastOptions,
    toastId: id,
  });
}

export default showToast;
