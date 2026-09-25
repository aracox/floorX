import { useState, type FormEvent } from 'react';
import { normalizeRotation, type Fixture } from '@floorx/floor-model';

type Changes = Pick<Fixture, 'position' | 'rotation' | 'dimensions'>;
export default function Properties({ fixture, name, onApply, onDelete }: { fixture: Fixture; name: string; onApply: (changes: Changes) => void; onDelete: () => void }) {
  const [error, setError] = useState('');
  const rotationDegrees = Number((fixture.rotation * 180 / Math.PI).toFixed(10));
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => Number(data.get(key));
    try {
      onApply({ position: { x: value('x'), z: value('z') }, rotation: value('rotation') === rotationDegrees ? fixture.rotation : normalizeRotation(value('rotation') * Math.PI / 180),
        dimensions: { width: value('width'), depth: value('depth'), height: value('height') } });
      setError('');
    } catch { setError('Enter valid dimensions and coordinates. Dimensions must exceed 0.000001 m and be at most 100,000 m.'); }
  }
  return <form className="property-form" onSubmit={apply}>
    <strong className="property-name">{name}</strong><p className="fixture-reference" title={fixture.id}>{fixture.id}</p>
    <fieldset><legend>Position</legend><div className="field-pair"><label>X (m)<input name="x" type="number" step="any" min="-100000" max="100000" required defaultValue={fixture.position.x} /></label><label>Z (m)<input name="z" type="number" step="any" min="-100000" max="100000" required defaultValue={fixture.position.z} /></label></div></fieldset>
    <fieldset><legend>Dimensions</legend>{(['width', 'depth', 'height'] as const).map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)} (m)<input name={name} type="number" step="any" min="0.0000011" max="100000" required defaultValue={fixture.dimensions[name]} /></label>)}</fieldset>
    <label>Rotation (°)<input name="rotation" type="number" step="any" required defaultValue={rotationDegrees} /></label>
    <p className="field-hint">Clockwise from the horizontal axis.</p>
    <button type="submit">Apply properties</button><button className="danger" type="button" onClick={onDelete}>Delete fixture</button>
    {error && <p role="alert" className="error">{error}</p>}
  </form>;
}
