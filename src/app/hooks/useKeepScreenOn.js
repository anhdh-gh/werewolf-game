// hooks/useKeepScreenOn.js
import { useEffect, useRef } from 'react';

const useKeepScreenOn = () => {
  const wakeLock = useRef(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock.current = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock is active');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    // Gọi lần đầu khi component mount
    requestWakeLock();

    // Lắng nghe khi người dùng chuyển tab rồi quay lại
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: Nhả lock khi component bị hủy (ví dụ: chuyển sang trang khác)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
        console.log('Screen Wake Lock released');
      }
    };
  }, []); // Chạy 1 lần khi component mount
};

export default useKeepScreenOn;