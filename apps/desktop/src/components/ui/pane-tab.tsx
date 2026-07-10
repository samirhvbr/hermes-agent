import * as React from 'react'

import { Codicon } from '@/components/ui/codicon'
import { cn } from '@/lib/utils'

interface PaneTabProps extends React.ComponentProps<'div'> {
  active?: boolean
  dirty?: boolean
  onClose?: () => void
  closeLabel?: string
}

/**
 * The editor tab shell shared by the preview rail and the layout-zone headers.
 *
 * `children` is the label region (a click target / drag handle supplied by the
 * caller). The close button rides over a gradient fade so it overlays the label
 * end on hover without ever shifting layout — the VS Code / file-preview feel.
 *
 * Colors derive from `--pane-tab-active-bg` — set it on the strip to the
 * background of the surface the tabs sit on. Active tabs blend into that
 * surface; inactive tabs are a slight darken of it.
 */
export const PaneTab = React.forwardRef<HTMLDivElement, PaneTabProps>(function PaneTab(
  { active = false, dirty = false, onClose, closeLabel, children, className, ...props },
  ref
) {
  return (
    <div
      className={cn(
        'group/tab relative flex h-full min-w-0 max-w-48 shrink-0 items-center bg-(--tab-bg) text-[0.6875rem] font-medium [-webkit-app-region:no-drag] last:border-r last:border-(--ui-stroke-quaternary)',
        active
          ? 'text-foreground [--tab-bg:var(--pane-tab-active-bg,var(--ui-editor-surface-background))]'
          : // VS Code's tab delta: inactive = surface mixed ~8% toward the
            // foreground, so it lightens on dark themes and darkens on light.
            'border-r border-(--ui-stroke-quaternary) text-(--ui-text-tertiary) [--tab-bg:color-mix(in_srgb,var(--pane-tab-active-bg,var(--ui-editor-surface-background))_92%,var(--ui-base))] hover:bg-(--chrome-action-hover) hover:text-foreground',
        className
      )}
      data-active={active}
      ref={ref}
      {...props}
    >
      {children}
      {onClose && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-9 bg-[linear-gradient(to_right,transparent,var(--tab-bg)_55%)] opacity-0 transition-opacity group-hover/tab:opacity-100 group-focus-within/tab:opacity-100"
        />
      )}
      {dirty && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-1.5 top-1/2 grid size-4 -translate-y-1/2 place-items-center transition-opacity group-hover/tab:opacity-0 group-focus-within/tab:opacity-0"
        >
          {/* Amber warn dot; a tab-bg ring keeps it legible over the filename. */}
          <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_0_2px_var(--tab-bg),0_1px_2px_rgba(0,0,0,0.45)] dark:bg-amber-400" />
        </span>
      )}
      {onClose && (
        <button
          aria-label={closeLabel}
          className="pointer-events-none absolute right-1.5 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-sm text-(--ui-text-tertiary) opacity-0 transition-[background-color,color,opacity] hover:bg-(--ui-bg-secondary) hover:text-foreground focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 group-focus-within/tab:pointer-events-auto group-focus-within/tab:opacity-100"
          onClick={event => {
            event.stopPropagation()
            onClose()
          }}
          onPointerDown={event => event.stopPropagation()}
          type="button"
        >
          <Codicon name="close" size="0.75rem" />
        </button>
      )}
    </div>
  )
})

interface PaneTabLabelProps extends React.ComponentProps<'button'> {
  /** `button` when the label is itself the activation target (preview rail);
   *  the default `span` defers clicks to the tab shell (zone headers). */
  as?: 'button' | 'span'
}

/** The truncating label region inside a `PaneTab`. Owns the label padding and
 *  typography — `className` merges into the text span, so callers can unset
 *  pieces (e.g. `normal-case` for filenames). */
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
