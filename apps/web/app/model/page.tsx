'use client';

import { useState } from 'react';
import { deserializeFloorDocument, fixtureCorners, parseFloorDocument, type Point } from '@floorx/floor-model';
import sample from '../../../../fixtures/floor-v1.json';

const initial = parseFloorDocument(sample);
const ringPath = (ring: Point[]) => `M ${ring.map((p) => `${p.x},${p.z}`).join(' L ')} Z`;

export default function Page() {
  const [document, setDocument] = useState(initial);
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [message, setMessage] = useState('Sample document loaded.');
  const [error, setError] = useState(false);
  const points = [...document.boundary.outer, ...document.fixtures.flatMap(fixtureCorners), ...document.walls.flatMap((w) => [w.start, w.end])];
  const minX = Math.min(...points.map((p) => p.x));
  const minZ = Math.min(...points.map((p) => p.z));
  const width = Math.max(...points.map((p) => p.x)) - minX;
  const depth = Math.max(...points.map((p) => p.z)) - minZ;
  const pad = Math.max(width, depth, 1) * 0.07;

  function apply() {
    try {
      setDocument(deserializeFloorDocument(json));
      setError(false);
      setMessage('Valid document applied to the preview.');
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Invalid document');
    }
  }

  function reset() {
    setDocument(initial);
    setJson(JSON.stringify(initial, null, 2));
    setError(false);
    setMessage('Sample document restored.');
  }

  return <main>
    <header><a className="brand" href="/">floor<span>X</span></a><span className="badge">MODEL PREVIEW</span><span className="units">All measurements in meters</span></header>
    <section className="intro"><p className="eyebrow">YOUR FLOOR, ONE SHARED MODEL</p><h1>A foundation for every layout.</h1><p>Inspect the sample floor, edit its document, and validate your changes.</p></section>
    <div className="workspace">
      <section className="panel preview"><div className="panel-heading"><div><h2>{document.name}</h2><p>{document.fixtures.length} fixtures · {document.walls.length} walls · {document.openings.length} openings</p></div><span className="badge">TOP VIEW</span></div>
        <svg role="img" aria-label="Floor plan preview showing the boundary, holes, fixtures, walls and openings" viewBox={`${minX - pad} ${minZ - pad} ${width + pad * 2} ${depth + pad * 2}`}>
          <path d={[document.boundary.outer, ...document.boundary.holes].map(ringPath).join(' ')} fill="#fff" fillRule="evenodd" stroke="#a8b7b1" strokeWidth={pad * 0.025} />
          {document.zones.map((zone) => <path key={zone.id} d={[zone.boundary.outer, ...zone.boundary.holes].map(ringPath).join(' ')} fill="#d8e8ff" fillOpacity="0.6" fillRule="evenodd" />)}
          {document.walls.map((wall) => <line key={wall.id} x1={wall.start.x} y1={wall.start.z} x2={wall.end.x} y2={wall.end.z} stroke="#344b45" strokeWidth={wall.thickness} />)}
          {document.openings.map((opening) => {
            const wall = document.walls.find((w) => w.id === opening.wallId)!;
            const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
            const ux = (wall.end.x - wall.start.x) / length, uz = (wall.end.z - wall.start.z) / length;
            return <line key={opening.id} x1={wall.start.x + ux * opening.offset} y1={wall.start.z + uz * opening.offset} x2={wall.start.x + ux * (opening.offset + opening.width)} y2={wall.start.z + uz * (opening.offset + opening.width)} stroke="#edab54" strokeWidth={wall.thickness * 1.15}><title>{`${opening.kind}: ${opening.width} m`}</title></line>;
          })}
          {document.fixtures.map((fixture) => <polygon key={fixture.id} points={fixtureCorners(fixture).map((p) => `${p.x},${p.z}`).join(' ')} fill="#338876" stroke="#18624f" strokeWidth={pad * 0.025}><title>{`${fixture.id}: ${fixture.dimensions.width} × ${fixture.dimensions.depth} m`}</title></polygon>)}
        </svg>
        <div className="legend"><span>🟩 Fixtures</span><span>━ Walls</span><span className="opening">━ Openings</span><span>Cutouts show boundary holes</span></div>
        <p className="note">Document preview · Drag-and-drop editing is the next milestone.</p>
      </section>
      <section className="panel inspector"><div className="panel-heading"><div><h2>Floor document</h2><p>Change positions or dimensions, then apply.</p></div></div>
        <label className="sr-only" htmlFor="document">Floor document JSON</label>
        <textarea id="document" spellCheck={false} value={json} onChange={(event) => setJson(event.target.value)} />
        <div className="actions"><button onClick={apply}>Validate & apply</button><button className="secondary" onClick={reset}>Reset sample</button></div>
        <pre role="status" className={error ? 'status error' : 'status'}>{message}</pre>
        <p className="note">Changes stay in this tab and reset on reload. Invalid documents keep the last valid preview.</p>
      </section>
    </div>
  </main>;
}
