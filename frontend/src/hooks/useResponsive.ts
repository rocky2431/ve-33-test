import { useState, useEffect } from 'react'
import { breakpoints } from '../constants/theme'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export function useResponsive() {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < breakpoints.mobile) return 'mobile'
    if (width < breakpoints.tablet) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < breakpoints.mobile) {
        setDeviceType('mobile')
      } else if (width < breakpoints.tablet) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  }
}
