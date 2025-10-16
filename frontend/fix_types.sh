#!/bin/bash

# 修复所有组件的类型导入
echo "修复类型导入..."

# 修复 Layout 组件
sed -i '' 's/^import { CSSProperties/import type { CSSProperties/g' src/components/Layout/*.tsx
sed -i '' 's/, ReactNode } from '\''react'\''/} from '\''react'\''\nimport type { ReactNode } from '\''react'\''/g' src/components/Layout/MainLayout.tsx
sed -i '' 's/^import { Page }/import type { Page }/g' src/components/Layout/MobileNav.tsx

# 修复业务组件
sed -i '' 's/^import { CSSProperties } from '\''react'\''/import type { CSSProperties } from '\''react'\''/g' src/components/Lock/CreateLock.tsx src/components/Dashboard/Dashboard.tsx src/components/Liquidity/*.tsx

echo "完成!"
