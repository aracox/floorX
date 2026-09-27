import { useState, type FormEvent } from 'react';
import { normalizeRotation, type Fixture } from '@floorx/floor-model';
import ShelfPlanogramEditor from './shelf-planogram-editor';

type Changes = Pick<Fixture, 'position' | 'rotation' | 'dimensions'> & { properties?: Fixture['properties'] };
export default function Properties({ fixture, name, onApply, onDelete }: {
  fixture: Fixture; name: string; onApply: (changes: Changes) => void; onDelete: () => void;
}) {
  const isShelving = ['gondola', 'wall-shelf', 'rack'].includes(fixture.definition.id) || typeof fixture.properties.rows === 'number';
  const initialRows = typeof fixture.properties.rows === 'number'
    ? Number(fixture.properties.rows)
    : (isShelving ? 2 : undefined);

  const [rows, setRows] = useState<number | undefined>(initialRows);
  const [height, setHeight] = useState(fixture.dimensions.height);
  const [error, setError] = useState('');
  const rotationDegrees = Number((fixture.rotation * 180 / Math.PI).toFixed(10));

  const handleRowsChange = (nextRowsVal: number) => {
    if (isNaN(nextRowsVal) || nextRowsVal < 1) return;
    const bounded = Math.max(1, Math.min(20, Math.round(nextRowsVal)));
    const prevRows = rows || 2;
    setRows(bounded);
    setHeight(Number((height * (bounded / prevRows)).toFixed(3)));
  };

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => Number(data.get(key));
    try {
      const finalRows = isShelving && rows !== undefined ? Math.max(1, Math.min(20, Math.round(rows))) : undefined;
      onApply({
        position: { x: value('x'), z: value('z') },
        rotation: value('rotation') === rotationDegrees ? fixture.rotation : normalizeRotation(value('rotation') * Math.PI / 180),
        dimensions: { width: value('width'), depth: value('depth'), height: value('height') },
        ...(finalRows !== undefined ? { properties: { ...fixture.properties, rows: finalRows } } : {}),
      });
      setError('');
    } catch {
      setError('Enter valid dimensions and coordinates. Dimensions must exceed 0.000001 m and be at most 100,000 m.');
    }
  }

  return <form className="property-form" onSubmit={apply}>
    <strong className="property-name">{name}</strong><p className="fixture-reference" title={fixture.id}>{fixture.id}</p>
    <fieldset><legend>Position</legend><div className="field-pair"><label>X (m)<input name="x" type="number" step="any" min="-100000" max="100000" required defaultValue={fixture.position.x} /></label><label>Z (m)<input name="z" type="number" step="any" min="-100000" max="100000" required defaultValue={fixture.position.z} /></label></div></fieldset>
    <fieldset><legend>Dimensions</legend>
      <label>Width (m)<input name="width" type="number" step="any" min="0.0000011" max="100000" required defaultValue={fixture.dimensions.width} /></label>
      <label>Depth (m)<input name="depth" type="number" step="any" min="0.0000011" max="100000" required defaultValue={fixture.dimensions.depth} /></label>
      <label>Height (m)<input name="height" type="number" step="any" min="0.0000011" max="100000" required value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
    </fieldset>
    {isShelving && <fieldset><legend>Shelving</legend>
      <label>Rows
        <input name="rows" type="number" min="1" max="20" step="1" required value={rows ?? 2}
          onChange={(e) => handleRowsChange(Number(e.target.value))} />
      </label>
      <p className="field-hint">Increasing rows scales total height proportionally.</p>
    </fieldset>}
    <label>Rotation (°)<input name="rotation" type="number" step="any" required defaultValue={rotationDegrees} /></label>
    <p className="field-hint">Clockwise from the horizontal axis.</p>
    <button type="submit">Apply properties</button>

    {isShelving && rows !== undefined && (
      <ShelfPlanogramEditor
        fixture={fixture}
        rows={rows}
        onChange={(nextPlanogram) => {
          onApply({
            position: fixture.position,
            rotation: fixture.rotation,
            dimensions: fixture.dimensions,
            properties: { ...fixture.properties, planogram: nextPlanogram as any },
          });
        }}
      />
    )}

    <button className="danger" type="button" onClick={onDelete}>Delete fixture</button>
    {error && <p role="alert" className="error">{error}</p>}
  </form>;
}

