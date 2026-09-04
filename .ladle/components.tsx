import '../src/styles/reset.css'
import '../src/styles/global.css'

import type { GlobalProvider } from '@ladle/react'

export const Provider: GlobalProvider = ({ children }) => <>{children}</>
