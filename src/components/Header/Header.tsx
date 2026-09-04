import * as React from 'react'

import { cn } from '../../utils'

import * as styles from './Header.css'

export type HeaderProps = React.ComponentPropsWithRef<'h1'>

export const Header = ({ className, ...rest }: HeaderProps) => (
  <h1 className={cn(styles.root, className)} {...rest}>
    Vite App Template
  </h1>
)
