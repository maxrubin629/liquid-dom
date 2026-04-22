import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Container, Glass, Group, Renderer, Scene } from 'liquid-glass-dom'
import { trackElement, type ElementTracker } from 'liquid-glass-dom/track-element'
import type { DragState, GlassFrame, TrackedOutline } from './shared'

export default function TrackerDemo() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const sourceOutlineRef = useRef<HTMLDivElement | null>(null)
  const trackerRef = useRef<ElementTracker | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [trackedOutline, setTrackedOutline] = useState<TrackedOutline>({
    x: 78,
    y: 112,
    width: 224,
    height: 148,
  })
  const [glassFrame, setGlassFrame] = useState<GlassFrame>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const mount = stageRef.current
    const sourceOutline = sourceOutlineRef.current
    if (!mount || !sourceOutline) {
      return
    }

    const scene = new Scene()

    const translatedGroup = new Group({
      x: 56,
      y: 48,
    })

    const container = new Container({
      x: 82,
      y: 58,
      blur: 7,
      spacing: 20,
      bezelWidth: 18,
      thickness: 88,
      tint: { r: 0.12, g: 0.16, b: 0.21, a: 0.58 },
    })

    const trackedGlass = new Glass({
      width: 180,
      height: 120,
      cornerRadius: 28,
      pointerEvents: true,
    })

    const labelGlass = new Glass({
      x: 42,
      y: 50,
      width: 220,
      height: 168,
      cornerRadius: 36,
      pointerEvents: true,
    })

    const overlayContainer = new Container({
      x: 494,
      y: 137,
      blur: 6,
      spacing: 18,
      bezelWidth: 16,
      thickness: 72,
      tint: { r: 0.18, g: 0.22, b: 0.26, a: 0.52 },
      zIndex: 1,
    })

    const overlayGlass = new Glass({
      x: 0,
      y: 0,
      width: 180,
      height: 110,
      cornerRadius: 32,
    })

    const dragLabel = document.createElement('div')
    dragLabel.className = 'drag-me-label'
    dragLabel.textContent = 'drag me'
    trackedGlass.setContent(dragLabel)

    container.add(trackedGlass)
    container.add(labelGlass)
    overlayContainer.add(overlayGlass)
    translatedGroup.add(container)
    translatedGroup.add(overlayContainer)
    scene.add(translatedGroup)

    const renderer = new Renderer({ scene })
    renderer.canvas.className = 'demo-canvas'
    mount.append(renderer.canvas)

    renderer.htmlRoot.innerHTML = `
      <div class="tracker-backdrop">
        <div class="tracker-grid"></div>
        <div class="tracker-glow tracker-glow-a"></div>
        <div class="tracker-glow tracker-glow-b"></div>
      </div>
    `

    trackerRef.current = trackElement({
      renderer,
      element: sourceOutline,
      glass: trackedGlass,
    })

    let frameId = 0
    const frame = () => {
      renderer.render()
      setGlassFrame({
        x: trackedGlass.x,
        y: trackedGlass.y,
        width: trackedGlass.width,
        height: trackedGlass.height,
      })
      frameId = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(frameId)
      trackerRef.current?.disconnect()
      trackerRef.current = null
      renderer.destroy()
      dragLabel.remove()
    }
  }, [])

  useEffect(() => {
    trackerRef.current?.update()
  }, [trackedOutline])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: trackedOutline.x,
      originY: trackedOutline.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    setTrackedOutline((current) => ({
      ...current,
      x: dragState.originX + (event.clientX - dragState.startClientX),
      y: dragState.originY + (event.clientY - dragState.startClientY),
    }))
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    dragStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  return (
    <section className="tracker-layout">
      <div className="tracker-main">
        <div className="panel tracker-controls-panel">
          <div className="tracker-controls">
            <label className="tracker-toggle">
              <input
                type="checkbox"
                checked={overlayVisible}
                onChange={(event) => setOverlayVisible(event.target.checked)}
              />
              <span>Show overlay</span>
            </label>

            <div className="tracker-control">
              <label htmlFor="tracker-width">outline width</label>
              <input
                id="tracker-width"
                type="range"
                min="140"
                max="360"
                value={trackedOutline.width}
                onChange={(event) => {
                  const width = Number(event.target.value)
                  setTrackedOutline((current) => ({ ...current, width }))
                }}
              />
              <span>{trackedOutline.width}px</span>
            </div>

            <div className="tracker-control">
              <label htmlFor="tracker-height">outline height</label>
              <input
                id="tracker-height"
                type="range"
                min="100"
                max="280"
                value={trackedOutline.height}
                onChange={(event) => {
                  const height = Number(event.target.value)
                  setTrackedOutline((current) => ({ ...current, height }))
                }}
              />
              <span>{trackedOutline.height}px</span>
            </div>
          </div>

          <div className="tracker-actions">
            <p className="muted">
              The red outline is the tracked DOM element. Drag it anywhere inside the stage and the large
              glass should match it immediately.
            </p>
            <p className="muted">
              Hide the overlay when you want to inspect the tracked glass by itself without the source marker
              on top.
            </p>
          </div>
        </div>

        <div className="tracker-stage-shell">
          <div className={overlayVisible ? 'tracker-source-layer' : 'tracker-source-layer hidden'}>
            <div
              ref={sourceOutlineRef}
              className={isDragging ? 'tracker-outline dragging' : 'tracker-outline'}
              style={{
                left: `${trackedOutline.x}px`,
                top: `${trackedOutline.y}px`,
                width: `${trackedOutline.width}px`,
                height: `${trackedOutline.height}px`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            />
          </div>

          <div className="canvas-shell tracker-canvas-shell" ref={stageRef} />
        </div>
      </div>

      <aside className="inspector">
        <div className="panel">
          <h2>Tracked glass frame</h2>
          <dl className="metric-grid">
            <div>
              <dt>x</dt>
              <dd>{glassFrame.x.toFixed(1)}</dd>
            </div>
            <div>
              <dt>y</dt>
              <dd>{glassFrame.y.toFixed(1)}</dd>
            </div>
            <div>
              <dt>width</dt>
              <dd>{glassFrame.width.toFixed(1)}</dd>
            </div>
            <div>
              <dt>height</dt>
              <dd>{glassFrame.height.toFixed(1)}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Checks</h2>
          <ul className="check-list">
            <li>The large glass should outline the red source rectangle.</li>
            <li>Dragging the red outline should move the glass immediately.</li>
            <li>The label glass should stay fixed so you can compare the tracked one against it.</li>
            <li>The tracked element remains outside the canvas even though it shares the same stage area.</li>
          </ul>
        </div>
      </aside>
    </section>
  )
}
