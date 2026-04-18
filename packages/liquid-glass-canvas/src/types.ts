/**
 * A 2D point in CSS pixel space.
 */
export type Point = {
  x: number
  y: number
}

/**
 * A local transform in the same coordinate space as normal HTML layout.
 */
export interface Transform {
  /** Horizontal translation in CSS pixels. */
  x: number
  /** Vertical translation in CSS pixels. */
  y: number
  /** Horizontal scale factor. */
  scaleX: number
  /** Vertical scale factor. */
  scaleY: number
  /** Clockwise rotation in radians. */
  rotation: number
  /** Local-space transform origin in CSS pixels. */
  origin: Point
}

/**
 * Surface profile used for the beveled glass edge.
 */
export type SurfaceProfile = 'convex' | 'concave' | 'lip'
