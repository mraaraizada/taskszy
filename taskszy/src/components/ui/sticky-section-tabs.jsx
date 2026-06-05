import React, { Children, isValidElement } from 'react'
import clsx from 'clsx'

const StickyTabItem = () => null

const StickyTabs = ({
  children,
  mainNavHeight = '0px',
  rootClassName = 'bg-black text-white',
  navSpacerClassName = 'border-b border-white/15 bg-black',
  sectionClassName = 'bg-[#131313]',
  stickyHeaderContainerClassName = 'shadow-lg',
  headerContentWrapperClassName = 'border-b border-t border-white/15 bg-black',
  headerContentLayoutClassName = 'mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8',
  titleClassName = 'my-0 text-2xl font-medium leading-none md:text-3xl lg:text-4xl',
  contentLayoutClassName = 'mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8',
}) => {
  const stickyTopValue = mainNavHeight === '0px' ? '0px' : `calc(${mainNavHeight} - 1px)`
  const stickyHeaderStyle = { top: stickyTopValue }

  return (
    <div className={clsx('overflow-clip', rootClassName)}>
      {/* Nav spacer — only render if mainNavHeight is set */}
      {mainNavHeight !== '0px' && (
        <div
          className={clsx('sticky left-0 top-0 z-20 w-full', navSpacerClassName)}
          style={{ height: mainNavHeight }}
          aria-hidden="true"
        />
      )}

      {Children.map(children, (child) => {
        if (!isValidElement(child) || child.type !== StickyTabItem) return null

        const { title, id, children: itemContent } = child.props

        return (
          <section key={id} className={clsx('relative overflow-clip', sectionClassName)}>
            <div
              className={clsx('sticky z-10 -mt-px flex flex-col', stickyHeaderContainerClassName)}
              style={stickyHeaderStyle}
            >
              <div className={clsx(headerContentWrapperClassName)}>
                <div className={clsx(headerContentLayoutClassName)}>
                  <h2 className={clsx(titleClassName)}>{title}</h2>
                </div>
              </div>
            </div>
            <div className={clsx(contentLayoutClassName)}>{itemContent}</div>
          </section>
        )
      })}
    </div>
  )
}

StickyTabs.Item = StickyTabItem
export default StickyTabs
