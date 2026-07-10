/**
 * Bridges a sidebar session drag (HTML5) into the SAME zone overlay a tab drag
 * uses — identical radial targeting (`subZonePosition`: elliptical center,
 * angle-picked edges), identical sheet visuals:
 *
 *   - CENTER region → the existing "link to chat" affordance (ChatDropOverlay
 *     + onDropSession). The bridge never claims it; the composer is center by
 *     definition, so linking/attaching is never shadowed by a split target.
 *   - EDGE region → tile drop: releasing opens the session as a tile docked on
 *     that edge of that zone.
 *
 * Fully self-contained on native DnD: a session drag is DETECTED from
 * `dataTransfer.types` during dragover (readable mid-drag, unlike values) and
 * the payload is READ from the drop event itself — no store handshake with the
 * drag source, so nothing can desync. A watchdog clears the overlay shortly
 * after drag events stop, so an aborted drag can never strand it.
 */

import { useEffect } from 'react'

import { snapshotZones, subZonePosition } from '@/components/pane-shell/tree/renderer/drag-session'
import { $dropHint, $treeDragging, SESSION_TILE_DRAG } from '@/components/pane-shell/tree/store'
import type { EngineZone } from '@/components/pane-shell/tree/zones-engine'
import { openSessionTile, type SplitDir } from '@/store/session-states'

import { dragHasSession, readSessionDrag } from './composer/inline-refs'

/** Drag events repeat continuously while a drag is alive; silence for this
 *  long means it ended, however it ended. */
const WATCHDOG_MS = 1_200

export function SessionTileDropBridge() {
  useEffect(() => {
    let watchdog = 0
    // Zone rects are stable while dragging (the layout never restructures
    // mid-drag) — snapshot per drag, lazily.
    let zones: EngineZone[] | null = null

    const active = () => $treeDragging.get() === SESSION_TILE_DRAG

    const clear = () => {
      window.clearTimeout(watchdog)
      zones = null

      if (active()) {
        $treeDragging.set(null)
        $dropHint.set(null)
      }
    }

    const arm = () => {
      window.clearTimeout(watchdog)
      watchdog = window.setTimeout(clear, WATCHDOG_MS)
    }

    // The chat surface (workspace or a tile) under the pointer, tagged with its
    // dock anchor. Sessions only ever target these — never the sidebar/terminal.
    const surfaceAt = (x: number, y: number): HTMLElement | null =>
      document
        .elementsFromPoint(x, y)
        .find((el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-session-anchor')) ?? null

    const onDragOver = (event: DragEvent) => {
      if (!dragHasSession(event.dataTransfer)) {
        return
      }

      // First sighting of this drag lights the zones; every sighting re-arms.
      if (!active()) {
        $treeDragging.set(SESSION_TILE_DRAG)
      }

      arm()

      const surface = surfaceAt(event.clientX, event.clientY)
      const groupId = surface?.closest<HTMLElement>('[data-tree-group]')?.dataset.treeGroup

      if (!surface || !groupId) {
        if ($dropHint.get()) {
          $dropHint.set(null)
        }

        return
      }

      // The composer (and everything in it) is always the link/attach drop;
      // elsewhere the shared radial targeting decides center vs edge.
      const pos = (event.target as HTMLElement | null)?.closest?.('[data-slot="composer-root"]')
        ? 'center'
        : subZonePosition((zones ??= snapshotZones()), groupId, event.clientX, event.clientY)

      // Publish the hovered zone even at center — the overlay fades its sheet
      // there (the link overlay owns the visual) but stays primed for edges.
      if (pos !== 'center') {
        event.preventDefault()
      }

      const current = $dropHint.get()

      if (current?.groupId !== groupId || current?.pos !== pos) {
        $dropHint.set({ groupId, groupIds: [groupId], kind: 'group', pos })
      }
    }

    const onDrop = (event: DragEvent) => {
      if (!dragHasSession(event.dataTransfer)) {
        return
      }

      const surface = surfaceAt(event.clientX, event.clientY)
      const pos = $dropHint.get()?.pos ?? 'center'
      const anchor = surface?.dataset.sessionAnchor ?? 'workspace'
      const payload = readSessionDrag(event.dataTransfer)
      clear()

      // Only edge drops are ours; a center drop falls through to the
      // surface's own onDropSession (the link).
      if (!surface || !payload || pos === 'center') {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      openSessionTile(payload.id, pos as SplitDir, anchor)
    }

    window.addEventListener('dragover', onDragOver, true)
    window.addEventListener('drop', onDrop, true)
    window.addEventListener('dragend', clear, true)

    return () => {
      window.removeEventListener('dragover', onDragOver, true)
      window.removeEventListener('drop', onDrop, true)
      window.removeEventListener('dragend', clear, true)
      clear()
    }
  }, [])

  return null
}
