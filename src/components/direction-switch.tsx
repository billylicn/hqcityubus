import type { Direction } from '../data/types';

const options: Array<{ value: Direction; label: string }> = [
  { value: 'toHengqin', label: '去横琴口岸' },
  { value: 'toUniversity', label: '去城市大学' },
];

export function DirectionSwitch({
  value,
  onChange,
}: {
  value: Direction;
  onChange: (direction: Direction) => void;
}) {
  return (
    <div className="direction-switch" role="group" aria-label="通勤方向">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
