/**
 * i18next 国际化配置
 * 支持中文和英文切换
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 从 localStorage 获取用户语言偏好，默认中文
const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'zh'
  } catch {
    return 'zh'
  }
}

// 保存语言偏好到 localStorage
export const saveLanguage = (lang: string) => {
  try {
    localStorage.setItem('language', lang)
  } catch {
    console.warn('Failed to save language preference')
  }
}

i18n
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: getStoredLanguage(), // 默认语言
    fallbackLng: 'zh', // 回退语言
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },
    react: {
      useSuspense: false, // 禁用 Suspense (避免加载问题)
    },
  })

export default i18n
