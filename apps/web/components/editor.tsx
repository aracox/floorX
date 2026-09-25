'use client';

import dynamic from 'next/dynamic';
import { useState, type KeyboardEvent } from 'react';
import { useStore } from 'zustand';
import { createEditorStore, fitViewport, screenToFloor, zoomAt } from '@floorx/state';
import { deserializeFloorDocument, parseFloorDocument, serializeFloorDocument, type Point } from '@floorx/floor-model';
import blankFloor from '../../../fixtures/blank-floor-v1.json';
import { fixtureCatalog } from '@floorx/component-library';
import Properties from './properties';
import { readLocalLayout } from './local-layout';

const Canvas = dynamic(() => import('./floor-canvas'), {
  ssr: false, loading: () => <div className="canvas-loading">Loading floor editor…</div>,
});
const Viewer = dynamic(() => import('./floor-viewer'), {
  ssr: false, loading: () => <div className="canvas-loading">Loading 3D viewer…</div>,
});
const initial = parseFloorDocument(blankFloor);

export default function Editor() {
  const [store] = useState(() => createEditorStore(initial));
  const state = useStore(store);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState('Ready. Add a fixture or select one to get started.');
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ width: 800, height: 620 });
  const dirty = serializeFloorDocument(state.document) !== state.savedJson;
  const selected = state.selectedIds.length === 1 ? state.document.fixtures.find((f) => f.id === state.selectedId) : null;

  function report(message: string, error = false) { setMessage(message); setError(error); }
  function add(definitionId: string, position: Point) {
    try {
      const definition = fixtureCatalog.find((item) => item.id === definitionId);
      if (!definition) throw new Error('Unknown fixture type');
      state.addFixture(`fixture-${crypto.randomUUID()}`, definition, position);
      setTool('select');
      report(`${definition.name} added. Drag it or edit its properties.`);
    } catch (cause) { report(cause instanceof Error ? cause.message : 'Unable to add fixture.', true); }
  }
  function zoom(factor: number) {
    state.setViewport(zoomAt(state.viewport, { x: size.width / 2, y: size.height / 2 }, factor));
  }
  function fit() {
    state.setViewport(fitViewport(state.document.boundary.outer, size));
  }
  function save() {
    try {
      const name = fileName ?? 'floorx-layout.json';
      const url = URL.createObjectURL(new Blob([serializeFloorDocument(state.document)], { type: 'application/json' }));
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        try { link.click(); } finally { link.remove(); }
        setFileName(name);
        state.markSaved();
        report(`${name} download started.`);
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch { report('Could not create the JSON file. Your edits are still here.', true); }
  }
  function recoverBrowserSave() {
    try {
      const saved = readLocalLayout(window.localStorage);
      if (!saved) { report('No earlier browser save found.'); return; }
      state.load(saved);
      setFileName(null);
      report('Earlier browser save loaded. Use Save JSON to keep it as a file.');
    } catch { report('Could not load the earlier browser save. Current layout preserved.', true); }
  }
  const newIds = (count: number) => Array.from({ length: count }, () => `fixture-${crypto.randomUUID()}`);
  function copy() {
    if (!state.selectedIds.length) return;
    state.copySelected(); report(`${state.selectedIds.length} fixture${state.selectedIds.length === 1 ? '' : 's'} copied within the editor.`);
  }
  function paste() {
    if (!state.clipboard) return;
    try { state.pasteCopied(newIds(state.clipboard.fixtures.length)); report('Copied fixtures pasted. Undo restores the previous layout.'); }
    catch { report('Could not paste those fixtures at this position.', true); }
  }
  function duplicate() {
    if (!state.selectedIds.length) return;
    try { state.duplicateSelected(newIds(state.selectedIds.length)); report('Selected fixtures duplicated. Undo restores the previous layout.'); }
    catch { report('Could not duplicate those fixtures at this position.', true); }
  }
  function remove() {
    const current = store.getState();
    if (!current.selectedIds.length) return;
    current.removeSelected(); report('Selected fixtures removed. Undo is available.');
  }
  function keyboard(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'Escape') { state.cancelMove(); state.select(null); setTool('select'); return; }
    if (state.move) return;
    const modifier = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (modifier && key === 'z') {
      event.preventDefault(); event.shiftKey ? state.redo() : state.undo();
    } else if (modifier && key === 'y') {
      event.preventDefault(); state.redo();
    } else if (modifier && key === 'a') {
      event.preventDefault(); state.selectAll();
    } else if (modifier && key === 'c' && state.selectedIds.length) {
      event.preventDefault(); copy();
    } else if (modifier && key === 'v' && state.clipboard) {
      event.preventDefault(); paste();
    } else if (modifier && key === 'd' && state.selectedIds.length) {
      event.preventDefault(); duplicate();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); remove();
    }
  }

  return <main className="editor" onKeyDown={keyboard}>
    <header><a className="brand" href="/">floor<span>X</span></a><span className="badge">FLOOR PLANNER</span>{fileName && <span className="layout-filename" title={fileName}>{fileName}</span>}<span className="units">Meters · JSON files</span><span className={`save-state ${dirty ? 'unsaved' : ''}`}>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span></header>
    <div className="editor-toolbar" aria-label="Editor toolbar">
      <div className="button-group"><button className={tool === 'select' ? '' : 'secondary'} aria-pressed={tool === 'select'} disabled={viewMode === '3d'} onClick={() => setTool('select')}>Select / move</button><button className={tool === 'pan' ? '' : 'secondary'} aria-pressed={tool === 'pan'} disabled={viewMode === '3d'} onClick={() => setTool('pan')}>Pan</button></div>
      <div className="button-group"><button className="secondary" disabled={!state.past.length || !!state.move} onClick={state.undo}>Undo</button><button className="secondary" disabled={!state.future.length || !!state.move} onClick={state.redo}>Redo</button></div>
      <div className="button-group"><button className="secondary" disabled={!state.selectedIds.length || !!state.move} onClick={copy}>Copy</button><button className="secondary" disabled={!state.clipboard || !!state.move} onClick={paste}>Paste</button><button className="secondary" disabled={!state.selectedIds.length || !!state.move} onClick={duplicate}>Duplicate</button><button className="secondary" disabled={!state.selectedIds.length || !!state.move} onClick={remove}>Delete</button></div>
      <div className="button-group save-actions"><button disabled={!!state.move} onClick={save}>Save JSON</button><label className="import-button">Open JSON<input aria-label="Open layout JSON" type="file" accept=".json,application/json" disabled={!!state.move} onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        try {
          const imported = deserializeFloorDocument(await file.text());
          store.getState().load(imported);
          setFileName(file.name);
          report('Layout opened. Changes can be saved as a JSON file.');
        } catch { report('Open failed: the file is not a valid floorX document. Current layout preserved.', true); }
      }} /></label><button className="secondary" disabled={!!state.move} onClick={recoverBrowserSave}>Recover browser save</button></div>
    </div>
    <div className="editor-workspace">
      <aside className="panel library">{viewMode === '2d' && <><div className="panel-heading"><h2>Components</h2></div><div className="palette-items">{fixtureCatalog.map((definition) => {
        const snapshot = state.document.definitions.find((item) => item.id === definition.id && item.version === definition.version) ?? definition;
        return <div className="palette-card" key={definition.id} draggable role="button" tabIndex={0}
          aria-label={`${snapshot.name}. Drag onto the floor, or press Enter to place at the view center.`}
          onDragStart={(event) => {
            event.dataTransfer.setData('application/floorx-component', definition.id);
            event.dataTransfer.effectAllowed = 'copy';
            const icon = event.currentTarget.querySelector<HTMLElement>('.fixture-icon');
            if (icon) event.dataTransfer.setDragImage(icon, icon.offsetWidth / 2, icon.offsetHeight / 2);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            add(definition.id, screenToFloor({ x: size.width / 2, y: size.height / 2 }, state.viewport));
          }}>
          <div className={`fixture-icon fixture-${definition.id}`} aria-hidden="true"><i /><i /><i /></div>
          <strong>{snapshot.name}</strong>
          <p>{snapshot.defaultDimensions.width} × {snapshot.defaultDimensions.depth} × {snapshot.defaultDimensions.height} m</p>
        </div>;
      })}</div></>}<div className="panel-heading"><h2>Fixtures <span className="count">{state.document.fixtures.length}</span></h2></div>
      <ul className="fixture-list">{state.document.fixtures.map((fixture, index) => {
        const name = state.document.definitions.find((item) => item.id === fixture.definition.id && item.version === fixture.definition.version)?.name ?? 'Fixture';
        return <li key={fixture.id}><button className={state.selectedIds.includes(fixture.id) ? 'selected' : 'secondary'} aria-pressed={state.selectedIds.includes(fixture.id)}
          onClick={(event) => { state.select(fixture.id, event.shiftKey || event.metaKey || event.ctrlKey); setTool('select'); }}><span>{name} {index + 1}</span>
          <small>{fixture.position.x.toFixed(2)}, {fixture.position.z.toFixed(2)} m</small></button></li>;
      })}</ul></aside>
      <section className="panel canvas-panel"><div className="canvas-toolbar"><span className="badge">{viewMode === '2d' ? '2D PLAN' : '3D VIEW'}</span>
        {viewMode === '2d' && <><span>{Math.round(state.viewport.scale / 32 * 100)}%</span><button className="secondary" aria-label="Zoom out" disabled={!!state.move} onClick={() => zoom(1 / 1.2)}>−</button><button className="secondary" aria-label="Zoom in" disabled={!!state.move} onClick={() => zoom(1.2)}>+</button><button className="secondary" disabled={!!state.move} onClick={fit}>Fit floor</button></>}
        <div className="button-group view-switch" aria-label="Floor view"><button className={viewMode === '2d' ? '' : 'secondary'} aria-pressed={viewMode === '2d'} disabled={!!state.move} onClick={() => setViewMode('2d')}>2D</button><button className={viewMode === '3d' ? '' : 'secondary'} aria-pressed={viewMode === '3d'} disabled={!!state.move} onClick={() => setViewMode('3d')}>3D</button></div></div>
        {viewMode === '2d' ? <Canvas store={store} tool={tool} onAdd={add} onSize={setSize} onDelete={remove} onError={(message) => report(message, true)} /> : <Viewer store={store} />}
        <div className="canvas-footer">{viewMode === '2d' ? <><span>⌘/Ctrl + drag to pan · ⌘/Ctrl + scroll to zoom · Pan tool: drag freely</span><span>Shift-click to multi-select · ⌘/Ctrl C/V/D · Esc cancels · ⌘/Ctrl Z undoes</span></> : <><span>Drag to orbit · Right-drag to pan · Scroll to zoom</span><span>Click a fixture to select it · Edit dimensions in Properties or switch to 2D</span></>}</div>
      </section>
      <aside className="panel properties"><div className="panel-heading"><h2>Properties</h2><span className="badge">METERS</span></div>{selected ? <Properties key={JSON.stringify(selected)} fixture={selected}
        name={state.document.definitions.find((item) => item.id === selected.definition.id && item.version === selected.definition.version)?.name ?? 'Fixture'} onApply={(changes) => {
        state.updateFixture(selected.id, changes); report('Fixture properties updated.');
      }} onDelete={remove} /> : state.selectedIds.length > 1 ? <div className="empty-selection"><div aria-hidden="true">▣</div><h3>{state.selectedIds.length} fixtures selected</h3><p>Drag a selected fixture to move the group. Copy, duplicate or delete the selection with the toolbar.</p></div> : <div className="empty-selection"><div aria-hidden="true">↖</div><h3>Select a fixture</h3><p>Click a fixture on the floor or choose one from the list to edit its properties.</p></div>}<div className="local-note"><strong>Save a JSON file</strong><p>Save JSON downloads your layout. Open JSON to continue editing a saved file. Each save creates a new download. Recover browser save loads layouts saved before this change.</p></div></aside>
    </div>
    <p role="status" className={`editor-status ${error ? 'error' : ''}`}>{message}</p>
  </main>;
}
