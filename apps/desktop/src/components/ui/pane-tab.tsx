import * as React from 'react'

import { cn } from '@/lib/utils'

/** Inset bottom stroke for a tab strip — titlebar color, cut by the active tab. */
export const PANE_TAB_STRIP_LINE = 'shadow-[inset_0_-1px_0_var(--ui-stroke-tertiary)]'

const TAB =
  'group/tab relative flex h-full min-w-0 max-w-48 shrink-0 items-center border-b border-b-transparent bg-(--tab-bg) text-[0.6875rem] font-medium not-first:border-l not-first:border-l-(--ui-stroke-quaternary) [-webkit-app-region:no-drag]'

const TAB_ACTIVE =
  'text-foreground [--tab-bg:var(--pane-tab-active-bg,var(--ui-editor-surface-background))]'

// Inactive = gutter. Hover = 4% translucent wash (VS Code/GitHub alpha hover),
// not an opaque recolor — and never touch borders.
const TAB_IDLE =
  'border-b-(--ui-stroke-tertiary) text-(--ui-text-tertiary) [--tab-bg:var(--pane-tab-strip-bg,var(--theme-card-seed))] hover:shadow-[inset_0_0_0_100vmax_color-mix(in_srgb,var(--ui-base)_4%,transparent)] hover:text-(--ui-text-secondary)'

interface PaneTabProps extends React.ComponentProps<'div'> {
  active?: boolean
  dirty?: boolean
  /** Middle-click close (no hover X — too easy to hit on small tabs). */
  onClose?: () => void
}

/**
 * Editor tab shell — preview rail + zone headers.
 *
 * Strip sets `--pane-tab-active-bg` (content surface) and `--pane-tab-strip-bg`
 * (gutter; prefer `--theme-card-seed` = VS Code `tab.inactiveBackground`).
 * Active merges into content; inactive sits flush in the gutter.
 */
export const PaneTab = React.forwardRef<HTMLDivElement, PaneTabProps>(function PaneTab(
  { active = false, dirty = false, onClose, onAuxClick, onMouseDown, children, className, ...props },
  ref
) {
  return (
    <div
      className={cn(TAB, active ? TAB_ACTIVE : TAB_IDLE, className)}
      data-active={active}
      onAuxClick={event => {
        // Middle-click closes (browser/IDE). Swallow mousedown so Chromium
        // doesn't autoscroll.
        if (onClose && event.button === 1) {
          event.preventDefault()
          onClose()
        }

        onAuxClick?.(event)
      }}
      onMouseDown={event => {
        if (onClose && event.button === 1) {
          event.preventDefault()
        }

        onMouseDown?.(event)
      }}
      ref={ref}
      {...props}
    >
      {children}
      {dirty && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-1.5 top-1/2 grid size-4 -translate-y-1/2 place-items-center"
        >
          <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_0_2px_var(--tab-bg),0_1px_2px_rgba(0,0,0,0.45)] dark:bg-amber-400" />
        </span>
      )}
    </div>
  )
})

interface PaneTabLabelProps extends React.ComponentProps<'button'> {
  /** `button` when the label is the activation target (preview rail);
   *  default `span` defers to the shell (zone drag/activate). */
  as?: 'button' | 'span'
}

/** Truncating label inside a `PaneTab`. `className` merges into the text span
 *  (e.g. `normal-case tracking-normal` for filenames). */
export const PaneTabLabel = React.forwardRef<HTMLElement, PaneTabLabelProps>(function PaneTabLabel(
  { as = 'span', className, children, ...props },
  ref
) {
  const Comp = as as React.ElementType

  return (
    <Comp
      className="flex h-full min-w-0 max-w-full items-center overflow-hidden px-2 text-left outline-none"
      ref={ref}
      {...props}
    >
      <span className={cn('block min-w-0 truncate text-[9px] font-medium tracking-wide uppercase', className)}>
        {children}
      </span>
    </Comp>
  )
})
