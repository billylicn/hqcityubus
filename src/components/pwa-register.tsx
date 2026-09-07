import { useEffect } from 'react';
import { sitePath } from '../lib/site-path';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(sitePath('sw.js')).catch(() => {
        // 在线访问不依赖 Service Worker，注册失败时网站仍可正常使用。
      });
    }
  }, []);
  return null;
}
