import {
  Children,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Renderer } from '../renderer'
import { Container as GlassContainer, Glass as GlassShape, Scene, type ContainerInit, type GlassInit } from '../scene'
import { trackElement, type ElementTracker } from '../track-element'

type PlacementMode = 'root' | 'backdrop' | 'container-overlay' | 'glass-content'

type RootRuntime = {
  scene: Scene
  renderer: Renderer
}

type RootContextValue = {
  runtime: RootRuntime | null
  canvasHostRef: MutableRefObject<HTMLDivElement | null>
  overlayHostRef: MutableRefObject<HTMLDivElement | null>
}

const DEFAULT_CONTAINER = new GlassContainer()
const DEFAULT_GLASS = new GlassShape()

const RootContext = createContext<RootContextValue | null>(null)
const PlacementContext = createContext<PlacementMode>('root')
const ContainerContext = createContext<GlassContainer | null>(null)

export type RootProps = {
  children?: ReactNode
  backdrop?: ReactNode
  className?: string
  style?: CSSProperties
  maxDpr?: number
}

export type ContainerProps = Pick<
  ContainerInit,
  | 'spacing'
  | 'blur'
  | 'bezelWidth'
  | 'thickness'
  | 'displacementFactor'
  | 'ior'
  | 'contentIor'
  | 'contentDepth'
  | 'dispersion'
  | 'surfaceProfile'
  | 'lightDirection'
  | 'specularStrength'
  | 'specularWidth'
  | 'specularFalloff'
  | 'oppositeSpecularStrength'
  | 'specularSharpness'
  | 'specularOpacity'
  | 'reflectionOffset'
  | 'tint'
  | 'zIndex'
> & {
  children?: ReactNode
}

export type GlassProps = Pick<
  GlassInit,
  'cornerRadius' | 'cornerTransitionSpeed' | 'pointerEvents' | 'zIndex'
> & {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

function cloneTint(tint: GlassContainer['tint']) {
  return {
    r: tint.r,
    g: tint.g,
    b: tint.b,
    a: tint.a,
  }
}

function getScene(node: { _parent: unknown } | Scene | null) {
  let current: { _parent: unknown } | Scene | null = node

  while (current) {
    if (current instanceof Scene) {
      return current
    }

    current = current._parent as { _parent: unknown } | Scene | null
  }

  return null
}

function appendNodeToEnd(parent: HTMLElement, child: HTMLElement) {
  if (parent.lastChild === child) {
    return
  }

  parent.append(child)
}

function syncSceneContainer(scene: Scene, container: GlassContainer) {
  if (container._parent !== scene) {
    container.remove()
    scene.add(container)
    return
  }

  const lastChild = scene._children[scene._children.length - 1]
  if (lastChild === container) {
    return
  }

  scene._children = scene._children.filter((child) => child !== container)
  scene._children.push(container)
  scene._notifyMutation()
}

function syncContainerGlass(container: GlassContainer, glass: GlassShape) {
  if (glass._parent !== container) {
    glass.remove()
    container.add(glass)
    return
  }

  const lastChild = container._children[container._children.length - 1]
  if (lastChild === glass) {
    return
  }

  container._children = container._children.filter((child) => child !== glass)
  container._children.push(glass)
  getScene(container)?._notifyMutation()
}

function applyContainerProps(target: GlassContainer, props: ContainerProps) {
  target.spacing = props.spacing ?? DEFAULT_CONTAINER.spacing
  target.blur = props.blur ?? DEFAULT_CONTAINER.blur
  target.bezelWidth = props.bezelWidth ?? DEFAULT_CONTAINER.bezelWidth
  target.thickness = props.thickness ?? DEFAULT_CONTAINER.thickness
  target.displacementFactor = props.displacementFactor ?? DEFAULT_CONTAINER.displacementFactor
  target.ior = props.ior ?? DEFAULT_CONTAINER.ior
  target.contentIor = props.contentIor ?? DEFAULT_CONTAINER.contentIor
  target.contentDepth = props.contentDepth ?? DEFAULT_CONTAINER.contentDepth
  target.dispersion = props.dispersion ?? DEFAULT_CONTAINER.dispersion
  target.surfaceProfile = props.surfaceProfile ?? DEFAULT_CONTAINER.surfaceProfile
  target.lightDirection = props.lightDirection ?? DEFAULT_CONTAINER.lightDirection
  target.specularStrength = props.specularStrength ?? DEFAULT_CONTAINER.specularStrength
  target.specularWidth = props.specularWidth ?? DEFAULT_CONTAINER.specularWidth
  target.specularFalloff = props.specularFalloff ?? DEFAULT_CONTAINER.specularFalloff
  target.oppositeSpecularStrength =
    props.oppositeSpecularStrength ?? DEFAULT_CONTAINER.oppositeSpecularStrength
  target.specularSharpness = props.specularSharpness ?? DEFAULT_CONTAINER.specularSharpness
  target.specularOpacity = props.specularOpacity ?? DEFAULT_CONTAINER.specularOpacity
  target.reflectionOffset = props.reflectionOffset ?? DEFAULT_CONTAINER.reflectionOffset
  target.tint = props.tint ? cloneTint(props.tint) : cloneTint(DEFAULT_CONTAINER.tint)
  target.zIndex = props.zIndex ?? DEFAULT_CONTAINER.zIndex
}

function applyGlassProps(target: GlassShape, props: GlassProps) {
  target.cornerRadius = props.cornerRadius ?? DEFAULT_GLASS.cornerRadius
  target.cornerTransitionSpeed =
    props.cornerTransitionSpeed ?? DEFAULT_GLASS.cornerTransitionSpeed
  target.pointerEvents = props.pointerEvents ?? DEFAULT_GLASS.pointerEvents
  target.zIndex = props.zIndex ?? DEFAULT_GLASS.zIndex
}

function useRootContext(componentName: string) {
  const context = useContext(RootContext)
  if (!context) {
    throw new Error(`${componentName} must be rendered under <Root>.`)
  }

  return context
}

function usePlacement(componentName: string, allowedPlacement: PlacementMode) {
  const placement = useContext(PlacementContext)
  if (placement === allowedPlacement) {
    return placement
  }

  if (componentName === 'Container' && placement === 'container-overlay') {
    throw new Error('<Container> cannot be nested inside another <Container>.')
  }
  if (componentName === 'Container' && placement === 'glass-content') {
    throw new Error('<Container> cannot be rendered inside <Glass> content.')
  }
  if (componentName === 'Container' && placement === 'backdrop') {
    throw new Error('<Container> cannot be rendered inside Root backdrop content.')
  }
  if (componentName === 'Glass' && placement === 'backdrop') {
    throw new Error('<Glass> cannot be rendered inside Root backdrop content.')
  }
  if (componentName === 'Glass' && placement === 'glass-content') {
    throw new Error('<Glass> cannot be rendered inside another <Glass> content subtree.')
  }

  throw new Error(`<${componentName}> is not allowed in this part of the Root tree.`)
}

/**
 * React root that owns the renderer canvas, overlay, and backdrop portal.
 */
export function Root({
  children,
  backdrop,
  className,
  style,
  maxDpr,
}: RootProps) {
  const canvasHostRef = useRef<HTMLDivElement | null>(null)
  const overlayHostRef = useRef<HTMLDivElement | null>(null)
  const [runtime, setRuntime] = useState<RootRuntime | null>(null)

  useLayoutEffect(() => {
    const canvasHost = canvasHostRef.current
    if (!canvasHost) {
      return
    }

    const scene = new Scene()
    const renderer = new Renderer({
      scene,
      maxDpr,
    })

    renderer.canvas.style.position = 'absolute'
    renderer.canvas.style.inset = '0'
    renderer.canvas.style.width = '100%'
    renderer.canvas.style.height = '100%'
    renderer.canvas.style.display = 'block'

    canvasHost.append(renderer.canvas)
    const nextRuntime = { scene, renderer }
    setRuntime(nextRuntime)

    return () => {
      renderer.destroy()
      renderer.canvas.remove()
    }
  }, [])

  useLayoutEffect(() => {
    if (!runtime) {
      return
    }

    runtime.renderer.maxDpr = maxDpr ?? 2
  }, [runtime, maxDpr])

  useEffect(() => {
    if (!runtime) {
      return
    }

    let frameId = 0
    const frame = () => {
      runtime.renderer.render()
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [runtime])

  const contextValue = useMemo(
    () => ({
      runtime,
      canvasHostRef,
      overlayHostRef,
    }),
    [runtime],
  )

  return (
    <RootContext.Provider value={contextValue}>
      <div className={className} style={{ position: 'relative', ...style }}>
        <div
          ref={canvasHostRef}
          style={{
            position: 'absolute',
            inset: 0,
          }}
        />
        <div
          ref={overlayHostRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            visibility: 'hidden',
          }}
        />
        <div style={{ display: 'none' }}>
          <PlacementContext.Provider value="root">{children}</PlacementContext.Provider>
        </div>
        {runtime
          ? createPortal(
              <PlacementContext.Provider value="backdrop">{backdrop}</PlacementContext.Provider>,
              runtime.renderer.htmlRoot,
            )
          : null}
      </div>
    </RootContext.Provider>
  )
}

/**
 * Declarative binding for an imperative container layer.
 */
export function Container(props: ContainerProps) {
  usePlacement('Container', 'root')
  const root = useRootContext('Container')
  const container = useMemo(() => new GlassContainer(), [])
  const overlayGroup = useMemo(() => {
    const element = document.createElement('div')
    element.style.position = 'absolute'
    element.style.inset = '0'
    element.style.width = '100%'
    element.style.height = '100%'
    element.style.display = 'block'
    return element
  }, [])
  const [attached, setAttached] = useState(false)

  useLayoutEffect(() => {
    const runtime = root.runtime
    const overlayHost = root.overlayHostRef.current
    if (!runtime || !overlayHost) {
      return
    }

    appendNodeToEnd(overlayHost, overlayGroup)
    syncSceneContainer(runtime.scene, container)
    setAttached(true)

    return () => {
      overlayGroup.remove()
      container.remove()
    }
  }, [container, overlayGroup, root.runtime, root.overlayHostRef])

  useLayoutEffect(() => {
    const runtime = root.runtime
    const overlayHost = root.overlayHostRef.current
    applyContainerProps(container, props)

    if (runtime) {
      syncSceneContainer(runtime.scene, container)
    }
    if (overlayHost) {
      appendNodeToEnd(overlayHost, overlayGroup)
    }
  })

  if (!attached) {
    return null
  }

  return createPortal(
    <ContainerContext.Provider value={container}>
      <PlacementContext.Provider value="container-overlay">{props.children}</PlacementContext.Provider>
    </ContainerContext.Provider>,
    overlayGroup,
  )
}

/**
 * Declarative binding for an imperative glass node tracked from a proxy DOM element.
 */
export function Glass({ children, className, style, ...props }: GlassProps) {
  usePlacement('Glass', 'container-overlay')
  const root = useRootContext('Glass')
  const container = useContext(ContainerContext)
  if (!container) {
    throw new Error('<Glass> must be rendered inside a <Container>.')
  }

  const glass = useMemo(() => new GlassShape(), [])
  const proxyRef = useRef<HTMLDivElement | null>(null)
  const trackerRef = useRef<ElementTracker | null>(null)
  const contentRootRef = useRef<Root | null>(null)
  const contentElement = useMemo(() => {
    const element = document.createElement('div')
    element.style.display = 'block'
    element.style.width = '100%'
    element.style.height = '100%'
    return element
  }, [])
  const hasContent = Children.toArray(children).length > 0
  const contentTree = (
    <RootContext.Provider value={root}>
      <PlacementContext.Provider value="glass-content">{children}</PlacementContext.Provider>
    </RootContext.Provider>
  )

  useLayoutEffect(() => {
    const runtime = root.runtime
    if (!runtime) {
      return
    }

    syncContainerGlass(container, glass)

    return () => {
      trackerRef.current?.disconnect()
      trackerRef.current = null
      glass.clearContent()
      glass.remove()
    }
  }, [container, glass, root.runtime])

  useLayoutEffect(() => {
    applyGlassProps(glass, props)
    glass.setContent(hasContent ? contentElement : null)

    if (root.runtime) {
      syncContainerGlass(container, glass)
    }

    trackerRef.current?.update()
  })

  useLayoutEffect(() => {
    let frameId = 0
    let tracker: ElementTracker | null = null
    let cancelled = false

    const connectTracker = () => {
      if (cancelled) {
        return
      }

      const runtime = root.runtime
      const proxy = proxyRef.current
      if (
        !runtime ||
        !proxy ||
        !proxy.isConnected ||
        glass._parent !== container ||
        getScene(glass) !== runtime.scene
      ) {
        frameId = requestAnimationFrame(connectTracker)
        return
      }

      tracker = trackElement({
        renderer: runtime.renderer,
        element: proxy,
        glass,
      })
      trackerRef.current = tracker
    }

    connectTracker()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      tracker?.disconnect()
      if (trackerRef.current === tracker) {
        trackerRef.current = null
      }
    }
  }, [container, glass, root.runtime])

  useLayoutEffect(() => {
    let frameId = 0
    let cancelled = false

    const renderContent = () => {
      if (cancelled) {
        return
      }

      if (!contentElement.isConnected) {
        frameId = requestAnimationFrame(renderContent)
        return
      }

      if (!contentRootRef.current) {
        contentRootRef.current = createRoot(contentElement)
      }

      contentRootRef.current.render(contentTree)
    }

    if (!hasContent) {
      contentRootRef.current?.render(null)
      return () => {
        cancelled = true
        cancelAnimationFrame(frameId)
      }
    }

    renderContent()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [contentElement, contentTree, hasContent])

  useLayoutEffect(() => {
    return () => {
      contentRootRef.current?.unmount()
      contentRootRef.current = null
    }
  }, [])

  return (
    <>
      <div ref={proxyRef} className={className} style={style} />
    </>
  )
}
