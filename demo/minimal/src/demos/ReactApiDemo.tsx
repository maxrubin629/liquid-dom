import { useState } from 'react'
import * as Glass from 'liquid-glass-dom/react'

export default function ReactApiDemo() {
  const [padding, setPadding] = useState(44)
  const [gap, setGap] = useState(22)
  const [railWidth, setRailWidth] = useState(196)
  const [cornerRadius, setCornerRadius] = useState(28)
  const [buttonClicks, setButtonClicks] = useState(0)

  return (
    <section className="tracker-layout">
      <div className="tracker-main">
        <div className="panel tracker-controls-panel">
          <div className="tracker-controls">
            <div className="tracker-control">
              <label htmlFor="react-padding">layout padding</label>
              <input
                id="react-padding"
                type="range"
                min="20"
                max="88"
                value={padding}
                onChange={(event) => setPadding(Number(event.target.value))}
              />
              <span>{padding}px</span>
            </div>

            <div className="tracker-control">
              <label htmlFor="react-gap">layout gap</label>
              <input
                id="react-gap"
                type="range"
                min="10"
                max="48"
                value={gap}
                onChange={(event) => setGap(Number(event.target.value))}
              />
              <span>{gap}px</span>
            </div>

            <div className="tracker-control">
              <label htmlFor="react-rail-width">rail width</label>
              <input
                id="react-rail-width"
                type="range"
                min="150"
                max="260"
                value={railWidth}
                onChange={(event) => setRailWidth(Number(event.target.value))}
              />
              <span>{railWidth}px</span>
            </div>

            <div className="tracker-control">
              <label htmlFor="react-corner-radius">corner radius</label>
              <input
                id="react-corner-radius"
                type="range"
                min="10"
                max="44"
                value={cornerRadius}
                onChange={(event) => setCornerRadius(Number(event.target.value))}
              />
              <span>{cornerRadius}px</span>
            </div>
          </div>

          <div className="tracker-actions">
            <p className="muted">
              This example uses the React API as a layout layer: normal React wrappers position the
              hidden proxy DOM, and those proxies drive each glass rectangle through
              `trackElement()`.
            </p>
            <p className="muted">
              Adjust padding, gap, rail width, and corner radius to verify that nested flex and
              grid layout changes immediately remap the underlying glass geometry.
            </p>
          </div>
        </div>

        <div className="tracker-stage-shell">
          <div className="canvas-shell tracker-canvas-shell">
            <Glass.Root
              style={{ width: '100%', height: '100%' }}
              backdrop={
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    background:
                      'radial-gradient(circle at 16% 18%, rgba(125, 216, 235, 0.22), transparent 24%), radial-gradient(circle at 82% 26%, rgba(150, 241, 202, 0.2), transparent 24%), linear-gradient(180deg, #0c1016 0%, #07090d 100%)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                      backgroundSize: '34px 34px',
                      maskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 0.85), transparent)',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      top: 42,
                      left: 46,
                      maxWidth: 430,
                      padding: '24px 28px',
                      borderRadius: 30,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 10,
                        fontSize: '0.72rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#96f1ca',
                      }}
                    >
                      liquid-glass-dom/react
                    </div>
                    <h1
                      style={{
                        margin: '0 0 12px',
                        fontSize: 'clamp(1.9rem, 3vw, 3rem)',
                        lineHeight: 0.96,
                      }}
                    >
                      Declarative layout wrappers can drive multiple glass layers at once.
                    </h1>
                    <p style={{ margin: 0, color: 'rgba(243, 245, 247, 0.78)' }}>
                      Padding {padding}px, gap {gap}px, rail width {railWidth}px, corner radius{' '}
                      {cornerRadius}px. The button below still lives inside a hosted DOM content
                      root and keeps normal browser interactivity.
                    </p>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      right: 44,
                      bottom: 42,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {['backdrop', 'overlay', 'content host', 'react layout'].map((label) => (
                      <span
                        key={label}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 999,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.72rem',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'rgba(243, 245, 247, 0.82)',
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              }
            >
              <Glass.Container
                zIndex={0}
                blur={7}
                spacing={22}
                bezelWidth={18}
                thickness={88}
                tint={{ r: 0.12, g: 0.16, b: 0.21, a: 0.58 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    gridTemplateColumns: `minmax(0, 1fr) ${railWidth}px`,
                    gap,
                    padding,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: 'minmax(0, 1.15fr) auto',
                      gap,
                      minWidth: 0,
                    }}
                  >
                    <Glass.Glass cornerRadius={cornerRadius + 6} style={{ width: '100%', height: '100%' }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 12,
                          height: '100%',
                          padding: 24,
                          boxSizing: 'border-box',
                          color: '#f3f5f7',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'rgba(243, 245, 247, 0.62)',
                          }}
                        >
                          hero glass
                        </span>
                        <strong style={{ fontSize: '1.42rem', lineHeight: 1.02 }}>
                          Nested grid wrappers define the main composition.
                        </strong>
                        <p style={{ margin: 0, color: 'rgba(243, 245, 247, 0.8)' }}>
                          This large panel stretches with the left track. Changing padding and gap
                          should immediately resize and reposition it without touching imperative
                          glass geometry.
                        </p>
                      </div>
                    </Glass.Glass>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                      <Glass.Glass cornerRadius={cornerRadius} style={{ width: '100%', height: 138 }}>
                        <div
                          style={{
                            display: 'grid',
                            gap: 8,
                            height: '100%',
                            padding: 22,
                            boxSizing: 'border-box',
                            color: '#f3f5f7',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: 'rgba(243, 245, 247, 0.62)',
                            }}
                          >
                            metric
                          </span>
                          <strong style={{ fontSize: '1.08rem', lineHeight: 1.02 }}>
                            Padding
                          </strong>
                          <p style={{ margin: 0, color: 'rgba(243, 245, 247, 0.8)' }}>
                            {padding}px around the grid
                          </p>
                        </div>
                      </Glass.Glass>

                      <Glass.Glass cornerRadius={cornerRadius} style={{ width: '100%', height: 138 }}>
                        <div
                          style={{
                            display: 'grid',
                            gap: 8,
                            height: '100%',
                            padding: 22,
                            boxSizing: 'border-box',
                            color: '#f3f5f7',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: 'rgba(243, 245, 247, 0.62)',
                            }}
                          >
                            metric
                          </span>
                          <strong style={{ fontSize: '1.08rem', lineHeight: 1.02 }}>
                            Gap
                          </strong>
                          <p style={{ margin: 0, color: 'rgba(243, 245, 247, 0.8)' }}>
                            {gap}px between cards
                          </p>
                        </div>
                      </Glass.Glass>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap, alignContent: 'start' }}>
                    <Glass.Glass cornerRadius={cornerRadius + 2} style={{ width: '100%', height: 172 }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 10,
                          height: '100%',
                          padding: 22,
                          boxSizing: 'border-box',
                          color: '#f3f5f7',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'rgba(243, 245, 247, 0.62)',
                          }}
                        >
                          side rail
                        </span>
                        <strong style={{ fontSize: '1.18rem', lineHeight: 1.02 }}>
                          Wrapper width is adjustable.
                        </strong>
                        <p style={{ margin: 0, color: 'rgba(243, 245, 247, 0.8)' }}>
                          The rail stays in normal layout flow while a separate container can still
                          overlap above it.
                        </p>
                      </div>
                    </Glass.Glass>

                    <Glass.Glass cornerRadius={cornerRadius + 2} style={{ width: '100%', height: 144 }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 14,
                          height: '100%',
                          padding: 22,
                          boxSizing: 'border-box',
                          color: '#f3f5f7',
                          alignContent: 'start',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'rgba(243, 245, 247, 0.62)',
                          }}
                        >
                          hosted dom
                        </span>
                        <strong style={{ fontSize: '1.08rem', lineHeight: 1.02 }}>
                          Content still handles pointer input.
                        </strong>
                        <button
                          type="button"
                          className="glass-button"
                          style={{ width: '100%', margin: 0 }}
                          onClick={() => setButtonClicks((current) => current + 1)}
                        >
                          Clicks {buttonClicks}
                        </button>
                      </div>
                    </Glass.Glass>
                  </div>
                </div>
              </Glass.Container>

              <Glass.Container
                zIndex={1}
                blur={6}
                spacing={18}
                bezelWidth={16}
                thickness={72}
                tint={{ r: 0.18, g: 0.21, b: 0.25, a: 0.52 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    padding: `${padding + 12}px ${padding + 18}px`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Glass.Glass cornerRadius={cornerRadius - 2} style={{ width: 216, height: 92 }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          height: '100%',
                          padding: '18px 20px',
                          boxSizing: 'border-box',
                          color: '#f3f5f7',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: 'rgba(243, 245, 247, 0.62)',
                          }}
                        >
                          upper container
                        </span>
                        <strong style={{ fontSize: '1.04rem', lineHeight: 1.02 }}>
                          Separate container layer above the grid
                        </strong>
                      </div>
                    </Glass.Glass>
                  </div>
                </div>
              </Glass.Container>
            </Glass.Root>
          </div>
        </div>
      </div>

      <aside className="inspector">
        <div className="panel">
          <h2>Layout state</h2>
          <dl className="metric-grid">
            <div>
              <dt>padding</dt>
              <dd>{padding}px</dd>
            </div>
            <div>
              <dt>gap</dt>
              <dd>{gap}px</dd>
            </div>
            <div>
              <dt>rail width</dt>
              <dd>{railWidth}px</dd>
            </div>
            <div>
              <dt>corner radius</dt>
              <dd>{cornerRadius}px</dd>
            </div>
            <div>
              <dt>button clicks</dt>
              <dd>{buttonClicks}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Checks</h2>
          <ul className="check-list">
            <li>The grid of glasses should reflow immediately when padding or gap changes.</li>
            <li>The right rail should widen and narrow when rail width changes.</li>
            <li>The small upper glass should stay above the main composition.</li>
            <li>The hosted button should still receive normal browser clicks.</li>
          </ul>
        </div>
      </aside>
    </section>
  )
}
