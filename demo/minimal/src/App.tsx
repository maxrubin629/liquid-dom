import { useState } from 'react'
import './App.css'
import FlexTrackerDemo from './demos/FlexTrackerDemo'
import PointerEventsDemo from './demos/PointerEventsDemo'
import ReactApiDemo from './demos/ReactApiDemo'
import TrackerDemo from './demos/TrackerDemo'
import type { DemoTab } from './demos/shared'

export default function App() {
  const [activeDemo, setActiveDemo] = useState<DemoTab>('pointer')

  return (
    <main className="minimal-app">
      <div className="app-shell">
        <aside className="demo-sidebar">
          <div className="demo-tabs" role="tablist" aria-orientation="vertical">
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === 'pointer'}
              className={activeDemo === 'pointer' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setActiveDemo('pointer')}
            >
              <span>Pointer events</span>
              <small>Per-glass hit testing and DOM coexistence</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === 'tracker'}
              className={activeDemo === 'tracker' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setActiveDemo('tracker')}
            >
              <span>Track element</span>
              <small>Mirror an external DOM rect into glass bounds</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === 'flex'}
              className={activeDemo === 'flex' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setActiveDemo('flex')}
            >
              <span>Track flex children</span>
              <small>Track three space-between flex items at once</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === 'react'}
              className={activeDemo === 'react' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setActiveDemo('react')}
            >
              <span>React API</span>
              <small>Declarative root, containers, and tracked glass proxies</small>
            </button>
          </div>
        </aside>

        <section className="demo-content">
          {activeDemo === 'pointer' ? (
            <PointerEventsDemo />
          ) : activeDemo === 'tracker' ? (
            <TrackerDemo />
          ) : activeDemo === 'flex' ? (
            <FlexTrackerDemo />
          ) : (
            <ReactApiDemo />
          )}
        </section>
      </div>
    </main>
  )
}
