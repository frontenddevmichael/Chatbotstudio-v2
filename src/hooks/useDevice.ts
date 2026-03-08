import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
}

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

function getDevice(w: number): DeviceType {
  if (w <= MOBILE_MAX) return 'mobile';
  if (w <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const type = getDevice(w);
    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      isTouch: typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0,
      width: w,
    };
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const type = getDevice(w);
      setInfo({
        type,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        isTouch: navigator.maxTouchPoints > 0,
        width: w,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return info;
}
