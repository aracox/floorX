'use client';

import dynamic from 'next/dynamic';
import { useState, type KeyboardEvent } from 'react';
import { useStore } from 'zustand';
import { createEditorStore, fitViewport, screenToFloor, zoomAt } from '@floorx/state';
import { deserializeFloorDocument, parseFloorDocument, serializeFloorDocument, type Point } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import Properties from './properties';
import { readLocalLayout, saveLocalLayout } from './local-layout';

const Canvas = dynamic(() => import('./floor-canvas'), {
  ssr: false, loading: () => <div className="canvas-loading">Loading floor editor…</div>,
});
const initial = parseFloorDocument(sample);
const gondola = initial.definitions[0];

export default function Editor() {
  const [store] = useState(() => createEditorStore(initial));
  const state = useStore(store);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [message, setMessage] = useState('Ready. Add a gondola or select a fixture to get started.');
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const dirty = serializeFloorDocument(state.document) !== state.savedJson;
  const selected = state.document.fixtures.find((f) => f.id === state.selectedId);

  function report(message: string, error = false) { setMessage(message); setError(error); }
  function add(position: Point) {
    try {
      state.addFixture(`fixture-${crypto.randomUUID()}`, gondola, position);
      setTool('select');
      report('Gondola added. Drag it or edit its properties.');
    } catch (cause) { report(cause instanceof Error ? cause.message : 'Unable to add fixture.', true); }
  }
  function zoom(factor: number) {
    state.setViewport(zoomAt(state.viewport, { x: size.width / 2, y: size.height / 2 }, factor));
  }
  function fit() {
    state.setViewport(fitViewport(state.document.boundary.outer, size));
  }
  function save() {
    try { saveLocalLayout(window.localStorage, state.document); state.markSaved(); report('Layout saved in this browser.'); }
    catch { report('Could not save. Browser storage may be unavailable or full. Your edits are still here.', true); }
  }
  function load() {
    try {
      const document = readLocalLayout(window.localStorage);
      if (!document) { report('No saved layout in this browser yet. Choose Save locally first.'); return; }
      state.load(document); report('Saved layout loaded. Undo restores your previous layout.');
    } catch { report('Could not load a valid saved layout. Your current layout has been preserved.', true); }
  }
  function exportDocument() {
    const url = URL.createObjectURL(new Blob([serializeFloorDocument(state.document)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'floorx-layout.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    report('Layout exported as JSON.');
  }
  function keyboard(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'Escape') { state.cancelMove(); state.select(null); setTool('select'); return; }
    if (state.move) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); event.shiftKey ? state.redo() : state.undo();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault(); state.redo();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); state.removeSelected();
    }
  }

  return <main className="editor" onKeyDown={keyboard}>
    <header><a className="brand" href="/">floor<span>X</span></a><span className="badge">FLOOR PLANNER</span><span className="units">Meters · Local workspace</span></header>
    <div className="editor-title"><div><p className="eyebrow">LAYOUT WORKSPACE</p><h1>{state.document.name}</h1><p>Arrange your floor. Every change stays in one shared model.</p></div><span className={`save-state ${dirty ? 'unsaved' : ''}`}>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span></div>
    <div className="editor-toolbar" aria-label="Editor toolbar">
      <div className="button-group"><button className={tool === 'select' ? '' : 'secondary'} aria-pressed={tool === 'select'} onClick={() => setTool('select')}>Select / move</button><button className={tool === 'pan' ? '' : 'secondary'} aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}>Pan</button></div>
      <div className="button-group"><button className="secondary" disabled={!state.past.length || !!state.move} onClick={state.undo}>Undo</button><button className="secondary" disabled={!state.future.length || !!state.move} onClick={state.redo}>Redo</button></div>
      <div className="button-group save-actions"><button disabled={!!state.move} onClick={save}>Save locally</button><button className="secondary" disabled={!!state.move} onClick={load}>Load saved</button><button className="secondary" disabled={!!state.move} onClick={exportDocument}>Export JSON</button><label className="import-button">Import JSON<input aria-label="Import layout JSON" type="file" accept=".json,application/json" disabled={!!state.move} onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        try {
          const imported = deserializeFloorDocument(await file.text());
          const savedJson = store.getState().savedJson;
          store.getState().load(imported);
          // Import is not a local save. Preserve the saved baseline until explicitly saved.
          store.setState({ savedJson });
          report('Layout imported. Save locally to keep it in this browser.');
        } catch { report('Import failed: the file is not a valid floorX document. Current layout preserved.', true); }
      }} /></label></div>
    </div>
    <div className="editor-workspace">
      <aside className="panel library"><div className="panel-heading"><h2>Components</h2></div><div className="palette-card" draggable onDragStart={(event) => { event.dataTransfer.setData('application/floorx-component', 'gondola'); event.dataTransfer.effectAllowed = 'copy'; }}>
        <div className="fixture-icon" aria-hidden="true"><i /><i /><i /></div><strong>Standard gondola</strong><p>4 × 0.8 × 1.8 m</p><button onClick={() => add(screenToFloor({ x: size.width / 2, y: size.height / 2 }, state.viewport))}>Add gondola</button><small>Or drag this card onto the floor</small>
      </div><div className="panel-heading"><h2>Fixtures <span className="count">{state.document.fixtures.length}</span></h2></div><ul className="fixture-list">{state.document.fixtures.map((fixture, index) => <li key={fixture.id}><button className={fixture.id === state.selectedId ? 'selected' : 'secondary'} aria-pressed={fixture.id === state.selectedId} onClick={() => { state.select(fixture.id); setTool('select'); }}><span>Gondola {index + 1}</span><small>{fixture.position.x.toFixed(2)}, {fixture.position.z.toFixed(2)} m</small></button></li>)}</ul></aside>
      <section className="panel canvas-panel"><div className="canvas-toolbar"><span className="badge">2D PLAN</span><span>{Math.round(state.viewport.scale / 32 * 100)}%</span><button className="secondary" aria-label="Zoom out" disabled={!!state.move} onClick={() => zoom(1 / 1.2)}>−</button><button className="secondary" aria-label="Zoom in" disabled={!!state.move} onClick={() => zoom(1.2)}>+</button><button className="secondary" disabled={!!state.move} onClick={fit}>Fit floor</button></div>
        <Canvas store={store} tool={tool} onAdd={add} onSize={setSize} onError={(message) => report(message, true)} />
        <div className="canvas-footer"><span>Scroll to zoom · Pan tool to move the view</span><span>Esc cancels a drag · ⌘/Ctrl Z undoes</span></div>
      </section>
      <aside className="panel properties"><div className="panel-heading"><h2>Properties</h2><span className="badge">METERS</span></div>{selected ? <Properties key={JSON.stringify(selected)} fixture={selected} onApply={(changes) => {
        state.updateFixture(selected.id, changes); report('Fixture properties updated.');
      }} onDelete={() => { state.removeSelected(); report('Fixture removed. Undo is available.'); }} /> : <div className="empty-selection"><div aria-hidden="true">↖</div><h3>Select a fixture</h3><p>Click a fixture on the floor or choose one from the list to edit its properties.</p></div>}<div className="local-note"><strong>Saved on this browser</strong><p>Use Save locally before closing. Load saved restores it after a reload. Export JSON to keep a portable copy.</p></div></aside>
    </div>
    <p role="status" className={`editor-status ${error ? 'error' : ''}`}>{message}</p>
  </main>;
}
