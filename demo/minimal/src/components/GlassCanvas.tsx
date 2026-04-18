import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Container, Glass, Renderer, Scene, type SurfaceProfile } from 'liquid-glass-canvas'
import { HtmlBackground } from './HtmlBackground'
import { hydrateStoredState, loadStoredState, saveStoredState } from './controlStorage'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

type TintColor = {
  r: number
  g: number
  b: number
  a: number
}

function channelToHex(value: number) {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0')
}

function tintToHex(tint: TintColor) {
  return `#${channelToHex(tint.r)}${channelToHex(tint.g)}${channelToHex(tint.b)}`
}

function hexToTint(hex: string, alpha: number): TintColor {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16) / 255,
    g: Number.parseInt(hex.slice(3, 5), 16) / 255,
    b: Number.parseInt(hex.slice(5, 7), 16) / 255,
    a: alpha,
  }
}

type ShapeSettings = {
  x: number
  y: number
  width: number
  height: number
  cornerRadius: number
  cornerTransitionSpeed: number
}

type RenderControls = {
  spacing: number
  blur: number
  bezelWidth: number
  thickness: number
  displacementFactor: number
  ior: number
  dispersion: number
  surfaceProfile: SurfaceProfile
  lightDirectionDegrees: number
  specularStrength: number
  specularWidth: number
  specularSharpness: number
  specularOpacity: number
  edgeSaturation: number
  reflectionOffset: number
  reflectionSaturation: number
  tint: TintColor
  showLight: boolean
  lightFollowsPointer: boolean
  shapes: ShapeSettings[]
}

const CONTROL_STORAGE_KEY = 'liquid-glass-controls'
const CONTROL_PANEL_COLLAPSED_STORAGE_KEY = 'liquid-glass-controls-collapsed'
const SHAPE_LABELS = ['Primary slab', 'Orbital blob', 'Lower bridge'] as const
const SURFACE_PROFILE_OPTIONS = [
  { value: 'convex', label: 'Convex squircle' },
  { value: 'concave', label: 'Concave' },
  { value: 'lip', label: 'Lip' },
] as const

function createDefaultControls(): RenderControls {
  return {
    spacing: 42.5,
    blur: 3.75,
    bezelWidth: 13.75,
    thickness: 90,
    displacementFactor: 1,
    ior: 1.5,
    dispersion: 0,
    surfaceProfile: 'convex',
    lightDirectionDegrees: -52,
    specularStrength: 1.4,
    specularWidth: 0.3,
    specularSharpness: 2,
    specularOpacity: 0.15,
    edgeSaturation: 1.7,
    reflectionOffset: 18,
    reflectionSaturation: 0.7,
    tint: { r: 0.15, g: 0.15, b: 0.15, a: 0.7 },
    showLight: false,
    lightFollowsPointer: false,
    shapes: [
      {
        x: 171.46,
        y: 174,
        width: 443.08,
        height: 48,
        cornerRadius: 598,
        cornerTransitionSpeed: 120,
      },
      {
        x: 118,
        y: 174,
        width: 48,
        height: 48,
        cornerRadius: 266,
        cornerTransitionSpeed: 120,
      },
      {
        x: 514.16,
        y: 613.15,
        width: 559.68,
        height: 161.7,
        cornerRadius: 80.85,
        cornerTransitionSpeed: 120,
      },
    ],
  }
}

function loadStoredControls(): RenderControls {
  return loadStoredState(CONTROL_STORAGE_KEY, createDefaultControls())
}

function resolveLightDirection(
  controls: Pick<RenderControls, 'lightDirectionDegrees' | 'lightFollowsPointer'>,
  pointer: { x: number; y: number },
) {
  const pointerInfluence = controls.lightFollowsPointer ? 1 : 0
  const pointerVectorX = pointer.x - 0.5
  const pointerVectorY = 0.5 - pointer.y
  const pointerMagnitude = Math.hypot(pointerVectorX, pointerVectorY)
  const pointerAzimuth =
    pointerMagnitude > 0.0001
      ? (Math.atan2(pointerVectorY, pointerVectorX) * 180) / Math.PI
      : controls.lightDirectionDegrees
  const effectiveDegrees =
    controls.lightDirectionDegrees * (1 - pointerInfluence) + pointerAzimuth * pointerInfluence
  const radians = degreesToRadians(effectiveDegrees)

  return {
    degrees: effectiveDegrees,
    radians,
    direction: {
      x: Math.cos(radians),
      y: Math.sin(radians),
    },
  }
}

function createRendererBundle() {
  const scene = new Scene()
  const container = new Container()
  const glasses = [new Glass(), new Glass(), new Glass()]
  for (const glass of glasses) {
    container.add(glass)
  }
  scene.add(container)

  return {
    renderer: new Renderer({ scene }),
    container,
    glasses,
  }
}

export function GlassCanvas() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const containerRef = useRef<Container | null>(null)
  const glassesRef = useRef<Glass[]>([])
  const frameRef = useRef<number | null>(null)
  const [pointerState, setPointerState] = useState({ x: 0.5, y: 0.5 })
  const [controls, setControls] = useState<RenderControls>(() => loadStoredControls())
  const [copyStatus, setCopyStatus] = useState('')
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(() =>
    loadStoredState(CONTROL_PANEL_COLLAPSED_STORAGE_KEY, false),
  )

  useEffect(() => {
    saveStoredState(CONTROL_STORAGE_KEY, controls)
  }, [controls])

  useEffect(() => {
    saveStoredState(CONTROL_PANEL_COLLAPSED_STORAGE_KEY, isControlsCollapsed)
  }, [isControlsCollapsed])

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host) {
      return
    }

    const bundle = createRendererBundle()
    rendererRef.current = bundle.renderer
    containerRef.current = bundle.container
    glassesRef.current = bundle.glasses

    const htmlRoot = createRoot(bundle.renderer.htmlRoot)
    htmlRoot.render(<HtmlBackground />)
    // htmlRoot.render(<img src={new URL('../assets/background.jpg', import.meta.url).href} className='size-full' />)

    const canvas = bundle.renderer.canvas
    canvas.className = 'glass-stage__canvas'
    host.append(canvas)

    function handlePointerMove(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect()
      setPointerState({
        x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
        y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      })
    }

    function handlePointerLeave() {
      setPointerState({ x: 0.5, y: 0.5 })
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    function renderLoop() {
      bundle.renderer.render()
      frameRef.current = requestAnimationFrame(renderLoop)
    }

    frameRef.current = requestAnimationFrame(renderLoop)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      queueMicrotask(() => {
        htmlRoot.unmount()
      })
      bundle.renderer.destroy()
      rendererRef.current = null
      containerRef.current = null
      glassesRef.current = []
      canvas.remove()
    }
  }, [])

  useEffect(() => {
    const renderer = rendererRef.current
    const container = containerRef.current
    const glasses = glassesRef.current
    if (!renderer || !container || glasses.length === 0) {
      return
    }

    const resolvedLight = resolveLightDirection(controls, pointerState)

    container.spacing = controls.spacing
    container.blur = controls.blur
    container.bezelWidth = controls.bezelWidth
    container.thickness = controls.thickness
    container.displacementFactor = controls.displacementFactor
    container.ior = controls.ior
    container.dispersion = controls.dispersion
    container.surfaceProfile = controls.surfaceProfile
    container.lightDirection = resolvedLight.radians
    container.specularStrength = controls.specularStrength
    container.specularWidth = controls.specularWidth
    container.specularSharpness = controls.specularSharpness
    container.specularOpacity = controls.specularOpacity
    container.edgeSaturation = controls.edgeSaturation
    container.reflectionOffset = controls.reflectionOffset
    container.reflectionSaturation = controls.reflectionSaturation
    container.tint = { ...controls.tint }

    controls.shapes.forEach((shape, index) => {
      const glass = glasses[index]
      glass.x = shape.x
      glass.y = shape.y
      glass.width = shape.width
      glass.height = shape.height
      glass.cornerRadius = shape.cornerRadius
      glass.cornerTransitionSpeed = shape.cornerTransitionSpeed
    })
  }, [controls, pointerState])

  function updateControl<
    Key extends Exclude<keyof RenderControls, 'shapes' | 'showLight' | 'lightFollowsPointer' | 'tint'>
  >(key: Key, value: RenderControls[Key]) {
    setControls((current) => ({
      ...current,
      [key]: value,
    }))
    setCopyStatus('')
  }

  function updateShape(index: number, key: keyof ShapeSettings, value: number) {
    setControls((current) => ({
      ...current,
      shapes: current.shapes.map((shape, shapeIndex) => {
        if (shapeIndex !== index) {
          return shape
        }

        return {
          ...shape,
          [key]: value,
        }
      }),
    }))
    setCopyStatus('')
  }

  function updateTint(channel: keyof TintColor, value: number) {
    setControls((current) => ({
      ...current,
      tint: {
        ...current.tint,
        [channel]: value,
      },
    }))
    setCopyStatus('')
  }

  function updateTintColor(hex: string) {
    setControls((current) => ({
      ...current,
      tint: hexToTint(hex, current.tint.a),
    }))
    setCopyStatus('')
  }

  async function handleCopySettings() {
    const payload = JSON.stringify(controls, null, 2)

    try {
      await navigator.clipboard.writeText(payload)
      setCopyStatus('Copied settings JSON.')
    } catch {
      setCopyStatus('Clipboard write failed.')
    }
  }

  async function handleApplySettingsFromClipboard() {
    try {
      const payload = await navigator.clipboard.readText()
      if (!payload.trim()) {
        setCopyStatus('Clipboard is empty.')
        return
      }

      const parsed = JSON.parse(payload)
      const nextControls = hydrateStoredState(createDefaultControls(), parsed)
      setControls(nextControls)
      setCopyStatus('Applied settings JSON from clipboard.')
    } catch (error) {
      if (error instanceof SyntaxError) {
        setCopyStatus('Clipboard does not contain valid JSON.')
        return
      }

      setCopyStatus('Clipboard read failed.')
    }
  }

  function handleResetControls() {
    setControls(createDefaultControls())
    setCopyStatus('')
  }

  function handleSurfaceProfileChange(surfaceProfile: SurfaceProfile) {
    setControls((current) => ({
      ...current,
      surfaceProfile,
    }))
    setCopyStatus('')
  }

  function handleLightOverlayToggle() {
    setControls((current) => ({
      ...current,
      showLight: !current.showLight,
    }))
    setCopyStatus('')
  }

  function handleLightFollowToggle() {
    setControls((current) => ({
      ...current,
      lightFollowsPointer: !current.lightFollowsPointer,
    }))
    setCopyStatus('')
  }

  function handleControlsCollapseToggle() {
    setIsControlsCollapsed((current) => !current)
  }

  function renderSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    precision = 2,
  }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
    precision?: number
  }) {
    return (
      <label className="glass-stage__slider">
        <div className="glass-stage__slider-head">
          <span>{label}</span>
          <span>{value.toFixed(precision)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    )
  }

  function renderColorPicker({
    label,
    value,
    onChange,
  }: {
    label: string
    value: TintColor
    onChange: (value: string) => void
  }) {
    return (
      <label className="glass-stage__slider">
        <div className="glass-stage__slider-head">
          <span>{label}</span>
          <span>{tintToHex(value).toUpperCase()}</span>
        </div>
        <input type="color" value={tintToHex(value)} onChange={(event) => onChange(event.target.value)} />
      </label>
    )
  }

  const resolvedLight = resolveLightDirection(controls, pointerState)
  const lightMarkerX = 50 + resolvedLight.direction.x * 23
  const lightMarkerY = 50 + resolvedLight.direction.y * 23
  const lightAngle = Math.atan2(resolvedLight.direction.y, resolvedLight.direction.x)
  const lightRayLength = 18
  const lightRayCenterX = 50 + resolvedLight.direction.x * 11
  const lightRayCenterY = 50 + resolvedLight.direction.y * 11

  return (
    <div className="glass-stage">
      <div ref={canvasHostRef} className="glass-stage__canvas-host" />
      {controls.showLight ? (
        <div className="glass-stage__light-visual" aria-hidden="true">
          <div
            className="glass-stage__light-ray"
            style={{
              left: `${lightRayCenterX}%`,
              top: `${lightRayCenterY}%`,
              width: `${lightRayLength}%`,
              transform: `translate(-50%, -50%) rotate(${lightAngle}rad)`,
            }}
          />
          <div
            className="glass-stage__light-marker"
            style={{
              left: `${lightMarkerX}%`,
              top: `${lightMarkerY}%`,
            }}
          />
          <div className="glass-stage__light-center" />
        </div>
      ) : null}
      <aside
        className={
          isControlsCollapsed
            ? 'glass-stage__controls glass-stage__controls--collapsed'
            : 'glass-stage__controls'
        }
      >
        <div className="glass-stage__controls-header">
          <div className="glass-stage__controls-copy">
            <p className="glass-stage__eyebrow">Renderer</p>
            <h2>Controls</h2>
          </div>
          <button
            type="button"
            className="glass-stage__button glass-stage__button--ghost glass-stage__collapse-button"
            onClick={handleControlsCollapseToggle}
            aria-expanded={!isControlsCollapsed}
            aria-controls="glass-stage-controls-body"
          >
            {isControlsCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        <div
          id="glass-stage-controls-body"
          className={
            isControlsCollapsed
              ? 'glass-stage__controls-body glass-stage__controls-body--hidden'
              : 'glass-stage__controls-body'
          }
        >
          <div className="glass-stage__toolbar">
            <button type="button" className="glass-stage__button" onClick={handleCopySettings}>
              Copy settings
            </button>
            <button
              type="button"
              className="glass-stage__button glass-stage__button--ghost"
              onClick={handleApplySettingsFromClipboard}
            >
              Apply clipboard
            </button>
            <button
              type="button"
              className="glass-stage__button glass-stage__button--ghost"
              onClick={handleResetControls}
            >
              Reset
            </button>
            {copyStatus ? <span className="glass-stage__copy-status">{copyStatus}</span> : null}
          </div>

          <section className="glass-stage__group">
            <h3>Surface response</h3>
            {renderSlider({
              label: 'Spacing',
              value: controls.spacing,
              min: 0,
              max: 96,
              step: 0.5,
              precision: 1,
              onChange: (value) => updateControl('spacing', value),
            })}
            <div className="glass-stage__segmented" role="tablist" aria-label="Surface profile">
              {SURFACE_PROFILE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    controls.surfaceProfile === option.value
                      ? 'glass-stage__segment glass-stage__segment--active'
                      : 'glass-stage__segment'
                  }
                  onClick={() => handleSurfaceProfileChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {renderSlider({
              label: 'Bezel width',
              value: controls.bezelWidth,
              min: 1,
              max: 240,
              step: 0.25,
              precision: 2,
              onChange: (value) => updateControl('bezelWidth', value),
            })}
            {renderSlider({
              label: 'Blur',
              value: controls.blur,
              min: 0,
              max: 24,
              step: 0.25,
              precision: 2,
              onChange: (value) => updateControl('blur', value),
            })}
            {renderSlider({
              label: 'Thickness',
              value: controls.thickness,
              min: 0,
              max: 200,
              step: 0.25,
              precision: 2,
              onChange: (value) => updateControl('thickness', value),
            })}
            {renderSlider({
              label: 'Displacement factor',
              value: controls.displacementFactor,
              min: 0,
              max: 24,
              step: 0.25,
              precision: 2,
              onChange: (value) => updateControl('displacementFactor', value),
            })}
            {renderSlider({
              label: 'IOR',
              value: controls.ior,
              min: 1.01,
              max: 2.2,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateControl('ior', value),
            })}
            {renderSlider({
              label: 'Dispersion',
              value: controls.dispersion,
              min: 0,
              max: 0.4,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateControl('dispersion', value),
            })}
          </section>

          <section className="glass-stage__group">
            <h3>Lighting</h3>
            <button
              type="button"
              className={
                controls.showLight
                  ? 'glass-stage__toggle glass-stage__toggle--active'
                  : 'glass-stage__toggle'
              }
              onClick={handleLightOverlayToggle}
            >
              {controls.showLight ? 'Hide light visual' : 'Show light visual'}
            </button>
            <button
              type="button"
              className={
                controls.lightFollowsPointer
                  ? 'glass-stage__toggle glass-stage__toggle--active'
                  : 'glass-stage__toggle'
              }
              onClick={handleLightFollowToggle}
            >
              {controls.lightFollowsPointer ? 'Light follows mouse' : 'Light ignores mouse'}
            </button>
            {renderSlider({
              label: 'Light direction',
              value: controls.lightDirectionDegrees,
              min: -180,
              max: 180,
              step: 1,
              precision: 0,
              onChange: (value) => updateControl('lightDirectionDegrees', value),
            })}
          </section>

          <section className="glass-stage__group">
            <h3>Specular</h3>
            {renderSlider({
              label: 'Strength',
              value: controls.specularStrength,
              min: 0,
              max: 20,
              step: 0.05,
              precision: 2,
              onChange: (value) => updateControl('specularStrength', value),
            })}
            {renderSlider({
              label: 'Width',
              value: controls.specularWidth,
              min: 0,
              max: 3,
              step: 0.05,
              precision: 2,
              onChange: (value) => updateControl('specularWidth', value),
            })}
            {renderSlider({
              label: 'Sharpness',
              value: controls.specularSharpness,
              min: 0,
              max: 50,
              step: 1,
              precision: 0,
              onChange: (value) => updateControl('specularSharpness', value),
            })}
            {renderSlider({
              label: 'Opacity',
              value: controls.specularOpacity,
              min: 0,
              max: 1,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateControl('specularOpacity', value),
            })}
            {renderSlider({
              label: 'Edge saturation',
              value: controls.edgeSaturation,
              min: 0,
              max: 5,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateControl('edgeSaturation', value),
            })}
            {renderSlider({
              label: 'Reflection offset',
              value: controls.reflectionOffset,
              min: 0,
              max: 128,
              step: 1,
              precision: 0,
              onChange: (value) => updateControl('reflectionOffset', value),
            })}
            {renderSlider({
              label: 'Reflection saturation',
              value: controls.reflectionSaturation,
              min: 0,
              max: 5,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateControl('reflectionSaturation', value),
            })}
          </section>

          <section className="glass-stage__group">
            <h3>Glass</h3>
            {renderColorPicker({
              label: 'Tint color',
              value: controls.tint,
              onChange: updateTintColor,
            })}
            {renderSlider({
              label: 'Tint alpha',
              value: controls.tint.a,
              min: 0,
              max: 1,
              step: 0.01,
              precision: 2,
              onChange: (value) => updateTint('a', value),
            })}
          </section>

          {controls.shapes.map((shape, index) => (
            <section className="glass-stage__group" key={SHAPE_LABELS[index]}>
              <h3>{SHAPE_LABELS[index]}</h3>
              {renderSlider({
                label: 'X',
                value: shape.x,
                min: 0,
                max: 3000,
                step: 1,
                precision: 0,
                onChange: (value) => updateShape(index, 'x', value),
              })}
              {renderSlider({
                label: 'Y',
                value: shape.y,
                min: 0,
                max: 2000,
                step: 1,
                precision: 0,
                onChange: (value) => updateShape(index, 'y', value),
              })}
              {renderSlider({
                label: 'Width',
                value: shape.width,
                min: 10,
                max: 2000,
                step: 1,
                precision: 0,
                onChange: (value) => updateShape(index, 'width', value),
              })}
              {renderSlider({
                label: 'Height',
                value: shape.height,
                min: 10,
                max: 1500,
                step: 1,
                precision: 0,
                onChange: (value) => updateShape(index, 'height', value),
              })}
              {renderSlider({
                label: 'Corner radius',
                value: shape.cornerRadius,
                min: 0,
                max: 1500,
                step: 1,
                precision: 0,
                onChange: (value) => updateShape(index, 'cornerRadius', value),
              })}
              {renderSlider({
                label: 'Corner transition speed',
                value: shape.cornerTransitionSpeed,
                min: 1,
                max: 240,
                step: 0.25,
                precision: 2,
                onChange: (value) => updateShape(index, 'cornerTransitionSpeed', value),
              })}
            </section>
          ))}
        </div>
      </aside>
    </div>
  )
}
