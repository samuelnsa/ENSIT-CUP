import React, { useState, useEffect } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const { src, alt, className, ...rest } = props
  const imageUrl = typeof src === 'string' && src.trim() ? src : undefined

  useEffect(() => {
    setDidError(false)
  }, [imageUrl])

  const fallbackClasses = `inline-flex items-center justify-center rounded-lg bg-slate-900/70 text-slate-400 ${className ?? ''}`

  return didError || !imageUrl ? (
    <div className={fallbackClasses}>
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt={alt || 'Image indisponible'} className="w-8 h-8 opacity-80" />
      </div>
    </div>
  ) : (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      {...rest}
      onError={() => setDidError(true)}
    />
  )
}
