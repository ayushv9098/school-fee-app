'use client'

import NextLink from 'next/link'
import NProgress from 'nprogress'
import { ComponentProps } from 'react'

export default function Link({ onClick, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      {...props}
      onClick={(e) => {
        NProgress.start()
        onClick?.(e)
      }}
    />
  )
}