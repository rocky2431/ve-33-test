/**
 * Chakra UI 组件样式配置
 * 自定义各个组件的默认样式
 */

export const components = {
  // 按钮组件
  Button: {
    defaultProps: {
      colorScheme: 'brand',
    },
    variants: {
      solid: {
        borderRadius: 'lg',
        fontWeight: 'medium',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'translateY(0)',
        },
        transition: 'all 0.2s',
      },
      outline: {
        borderRadius: 'lg',
        fontWeight: 'medium',
        borderWidth: '2px',
      },
      ghost: {
        borderRadius: 'lg',
        fontWeight: 'medium',
      },
    },
  },

  // 卡片组件
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        boxShadow: 'md',
        bg: 'white',
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.700',
        },
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: 'xl',
          _hover: {
            boxShadow: '2xl',
          },
          transition: 'all 0.3s',
        },
      },
      outline: {
        container: {
          borderWidth: '1px',
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.700',
          },
        },
      },
    },
  },

  // 输入框组件
  Input: {
    defaultProps: {
      size: 'lg',
      focusBorderColor: 'brand.500',
    },
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          borderColor: 'gray.300',
          _dark: {
            borderColor: 'gray.600',
            bg: 'gray.800',
          },
          _hover: {
            borderColor: 'gray.400',
            _dark: {
              borderColor: 'gray.500',
            },
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },

  // 模态框组件
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: 'xl',
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
      },
      overlay: {
        bg: 'blackAlpha.600',
        backdropFilter: 'blur(4px)',
      },
    },
  },

  // 表格组件
  Table: {
    variants: {
      simple: {
        th: {
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.700',
          },
          fontWeight: 'semibold',
          textTransform: 'none',
          letterSpacing: 'normal',
        },
        td: {
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.700',
          },
        },
        tbody: {
          tr: {
            _hover: {
              bg: 'gray.50',
              _dark: {
                bg: 'gray.700',
              },
            },
          },
        },
      },
    },
  },

  // Badge 组件
  Badge: {
    baseStyle: {
      borderRadius: 'md',
      fontWeight: 'medium',
      px: 2,
      py: 1,
    },
  },

  // Tooltip 组件
  Tooltip: {
    baseStyle: {
      borderRadius: 'md',
      bg: 'gray.700',
      color: 'white',
      px: 3,
      py: 2,
      _dark: {
        bg: 'gray.900',
      },
    },
  },

  // Tabs 组件
  Tabs: {
    variants: {
      line: {
        tab: {
          borderColor: 'transparent',
          _selected: {
            color: 'brand.500',
            borderColor: 'brand.500',
          },
          _hover: {
            color: 'brand.600',
          },
        },
      },
    },
  },
}
