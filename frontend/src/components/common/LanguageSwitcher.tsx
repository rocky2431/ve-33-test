/**
 * 语言切换组件
 * 支持中文和英文切换
 */

import { useTranslation } from 'react-i18next'
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { saveLanguage } from '../../i18n/config'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    saveLanguage(lang)
  }

  const languages = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
  ]

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        size="sm"
        variant="ghost"
        fontWeight="medium"
      >
        {currentLanguage.label}
      </MenuButton>
      <MenuList>
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            bg={i18n.language === lang.code ? 'brand.50' : 'transparent'}
            _dark={{
              bg: i18n.language === lang.code ? 'brand.900' : 'transparent',
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}
