import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { membersByGeneration, fullName } from '../../lib/lineage';

interface Props {
  onSelect: (memberId: string) => void;
}

const AVATAR_HALF = 40; // roughly half an avatar + label width, so outer nodes aren't flush against the edge
const RING_GAP = 118;

export const RadialTree: React.FC<Props> = ({ onSelect }) => {
  const { data } = useApp();

  const rings = useMemo(() => {
    const byGen = membersByGeneration(data.members);
    return Array.from(byGen.entries())
      .sort(([a], [b]) => a - b)
      .map(([gen, members], idx) => {
        const radius = idx === 0 ? 0 : idx * RING_GAP + 40;
        const count = members.length;
        return {
          gen,
          radius,
          points: members.map((m, i) => {
            const angle = count === 1 ? -Math.PI / 2 : (i / count) * 2 * Math.PI - Math.PI / 2;
            return {
              member: m,
              // x/y are stored relative to the ring center (0,0) here; the
              // component below offsets them by CENTER once SIZE is known.
              rx: radius * Math.cos(angle),
              ry: radius * Math.sin(angle),
            };
          }),
        };
      });
  }, [data.members]);

  // The canvas has to grow with however many generations exist — a fixed
  // size would push outer-ring members past its own bounds, where they'd
  // not only get visually clipped but would also be invisible to any
  // "fit the whole tree in view" sizing logic upstream (since that logic
  // trusts this element's own declared width/height).
  const maxRadius = rings.reduce((max, r) => Math.max(max, r.radius), 0);
  const SIZE = Math.max(320, (maxRadius + AVATAR_HALF) * 2);
  const CENTER = SIZE / 2;

  return (
    <div className="rounded-2xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-heritage-cream-50 dark:bg-heritage-dark-card p-4 md:p-6 inline-block">
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        <svg className="absolute inset-0" width={SIZE} height={SIZE}>
          {rings.map(r => r.radius > 0 && (
            <circle key={r.gen} cx={CENTER} cy={CENTER} r={r.radius} fill="none" stroke="#c5a059" strokeOpacity={0.35} strokeDasharray="3 5" />
          ))}
          {rings.map(r =>
            r.points.map(pt => (
              <line key={pt.member.id} x1={CENTER} y1={CENTER} x2={CENTER + pt.rx} y2={CENTER + pt.ry} stroke="#dfc270" strokeOpacity={0.35} />
            ))
          )}
        </svg>

        {rings.map(r =>
          r.points.map(pt => (
            <button
              key={pt.member.id}
              onClick={() => onSelect(pt.member.id)}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: CENTER + pt.rx, top: CENTER + pt.ry }}
            >
              <img
                src={pt.member.avatarUrl}
                className={`rounded-full bg-heritage-cream-200 border-2 shadow-soft group-hover:scale-110 transition-transform
                  ${r.gen === rings[0].gen ? 'w-16 h-16 border-heritage-gold-500' : 'w-11 h-11 border-white dark:border-heritage-dark-border'}`}
                alt=""
              />
              <p className="mt-1 text-[10px] font-medium text-heritage-green-900 dark:text-heritage-dark-text bg-heritage-cream-50/90 dark:bg-heritage-dark-card/90 rounded px-1 whitespace-nowrap">
                {fullName(pt.member)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
