import type { FormEvent } from 'react';
import type { Filters as FiltersValue } from '../types';

type Props = {
  value: FiltersValue;
  onChange: (next: FiltersValue) => void;
  onReset: () => void;
};

export function Filters({ value, onChange, onReset }: Props) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onChange(value);
  };

  return <form className="toolbar" onSubmit={submit}>
    <label>상태<select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}><option value="">전체</option><option>completed</option><option>failed</option><option>pending</option></select></label>
    <label>모델<input value={value.model} placeholder="model" onChange={(event) => onChange({ ...value, model: event.target.value })} /></label>
    <label>시작일<input type="datetime-local" value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} /></label>
    <label>종료일<input type="datetime-local" value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} /></label>
    <button>필터 적용</button><button type="button" onClick={onReset}>초기화</button>
  </form>;
}
