import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Container, Glass, Group, Renderer, Scene } from 'liquid-glass-dom'
import { trackElement, type ElementTracker } from 'liquid-glass-dom/track-element'
import type { DragState, GlassFrame, TrackedOutline } from './shared'

export default function FlexTrackerDemo() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const flexBoxRef = useRef<HTMLDivElement | null>(null)
  const childRefs = [
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
  ] as const
  const trackerRefs = useRef<Array<ElementTracker | null>>([])
  const dragStateRef = useRef<DragState | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [flexBox, setFlexBox] = useState<TrackedOutline>({
    x: 72,
    y: 124,
    width: 360,
    height: 176,
  })
  const [glassFrames, setGlassFrames] = useState<GlassFrame[]>([
    { x: 0, y: 0, width: 0, height: 0 },
    { x: 0, y: 0, width: 0, height: 0 },
    { x: 0, y: 0, width: 0, height: 0 },
  ])

  useEffect(() => {
    const mount = stageRef.current
    const flexBoxElement = flexBoxRef.current
    const childElements = childRefs.map((ref) => ref.current)
    if (!mount || !flexBoxElement || childElements.some((element) => !element)) {
      return
    }

    const scene = new Scene()

    const translatedGroup = new Group({
      x: 48,
      y: 42,
    })

    const container = new Container({
      x: 78,
      y: 62,
      blur: 7,
      spacing: 22,
      bezelWidth: 18,
      thickness: 90,
      tint: { r: 0.11, g: 0.16, b: 0.22, a: 0.56 },
    })

    const trackedGlasses = [
      new Glass({ width: 80, height: 120, cornerRadius: 30 }),
      new Glass({ width: 80, height: 120, cornerRadius: 30 }),
      new Glass({ width: 80, height: 120, cornerRadius: 30 }),
    ]

    const labelGlass = new Glass({
      x: 54,
      y: 46,
      width: 220,
      height: 180,
      cornerRadius: 34,
      pointerEvents: true,
    })

    const overlayContainer = new Container({
      x: 502,
      y: 146,
      blur: 6,
      spacing: 16,
      bezelWidth: 16,
      thickness: 70,
      tint: { r: 0.18, g: 0.22, b: 0.26, a: 0.52 },
      zIndex: 1,
    })

    const overlayGlass = new Glass({
      x: 0,
      y: 0,
      width: 164,
      height: 104,
      cornerRadius: 30,
    })

    const dragLabels = trackedGlasses.map(() => {
      const label = document.createElement('div')
      label.className = 'drag-me-label'
      label.textContent = 'drag me'
      return label
    })

    for (let index = 0; index < trackedGlasses.length; index += 1) {
      trackedGlasses[index].setContent(dragLabels[index])
    }

    for (const glass of trackedGlasses) {
      container.add(glass)
    }
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

    trackerRefs.current = childElements.map((element, index) =>
      trackElement({
        renderer,
        element: element!,
        glass: trackedGlasses[index],
      }),
    )

    let frameId = 0
    const frame = () => {
      renderer.render()
      setGlassFrames(
        trackedGlasses.map((glass) => ({
          x: glass.x,
          y: glass.y,
          width: glass.width,
          height: glass.height,
        })),
      )
      frameId = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(frameId)
      for (const tracker of trackerRefs.current) {
        tracker?.disconnect()
      }
      trackerRefs.current = []
      renderer.destroy()
      for (const label of dragLabels) {
        label.remove()
      }
    }
  }, [])

  useEffect(() => {
    for (const tracker of trackerRefs.current) {
      tracker?.update()
    }
  }, [flexBox])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: flexBox.x,
      originY: flexBox.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    setFlexBox((current) => ({
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
              <label htmlFor="flex-width">flex width</label>
              <input
                id="flex-width"
                type="range"
                min="240"
                max="520"
                value={flexBox.width}
                onChange={(event) => {
                  const width = Number(event.target.value)
                  setFlexBox((current) => ({ ...current, width }))
                }}
              />
              <span>{flexBox.width}px</span>
            </div>

            <div className="tracker-control">
              <label htmlFor="flex-height">flex height</label>
              <input
                id="flex-height"
                type="range"
                min="120"
                max="260"
                value={flexBox.height}
                onChange={(event) => {
                  const height = Number(event.target.value)
                  setFlexBox((current) => ({ ...current, height }))
                }}
              />
              <span>{flexBox.height}px</span>
            </div>
          </div>

          <div className="tracker-actions">
            <p className="muted">
              The red outer box is a flex container with `justify-content: space-between` and `align-items:
              stretch`. Drag the whole box around the stage and each child glass should follow.
            </p>
            <p className="muted">
              Width and height changes should redistribute the flex children, and the three tracked glasses
              should update to match the new child layout.
            </p>
          </div>
        </div>

        <div className="tracker-stage-shell">
          <div className={overlayVisible ? 'tracker-source-layer' : 'tracker-source-layer hidden'}>
            <div
              ref={flexBoxRef}
              className={isDragging ? 'flex-overlay dragging' : 'flex-overlay'}
              style={{
                left: `${flexBox.x}px`,
                top: `${flexBox.y}px`,
                width: `${flexBox.width}px`,
                height: `${flexBox.height}px`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            >
              <div ref={childRefs[0]} className="flex-overlay-child child-a" />
              <div ref={childRefs[1]} className="flex-overlay-child child-b" />
              <div ref={childRefs[2]} className="flex-overlay-child child-c" />
            </div>
          </div>

          <div className="canvas-shell tracker-canvas-shell" ref={stageRef} />
        </div>
      </div>

      <aside className="inspector">
        <div className="panel">
          <h2>Tracked children</h2>
          <dl className="metric-grid">
            <div>
              <dt>left width</dt>
              <dd>{glassFrames[0].width.toFixed(1)}</dd>
            </div>
            <div>
              <dt>middle width</dt>
              <dd>{glassFrames[1].width.toFixed(1)}</dd>
            </div>
            <div>
              <dt>right width</dt>
              <dd>{glassFrames[2].width.toFixed(1)}</dd>
            </div>
            <div>
              <dt>child height</dt>
              <dd>{glassFrames[0].height.toFixed(1)}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Checks</h2>
          <ul className="check-list">
            <li>Each glass should align to one flex child.</li>
            <li>Dragging the red flex box should move all three glasses together.</li>
            <li>Changing the flex width should change the gaps while keeping children stretched.</li>
            <li>Changing the flex height should stretch all three children vertically.</li>
          </ul>
        </div>
      </aside>
    </section>
  )
}
