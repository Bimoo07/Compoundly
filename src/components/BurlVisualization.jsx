import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createTimeline, stagger } from 'animejs';

const NODE_COUNT = 6;
const RADIUS = 62;
const CENTER = 100;

function polarToCartesian(angleDeg, radius) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

const SATELLITES = Array.from({ length: NODE_COUNT }, (_, i) =>
  polarToCartesian((360 / NODE_COUNT) * i, RADIUS)
);

/**
 * The Burl Effect hero visual — a center node connected to 6 satellite
 * nodes, matching the "knot of strength" icon from the original design.
 *
 * On mount, it draws itself: center node appears, then each connecting
 * line "grows" outward from the center while its satellite node pops in,
 * staggered so the whole shape assembles piece by piece rather than
 * appearing all at once. Ends with a soft settling pulse.
 *
 * This is the ONE place in the app that uses Anime.js (per the project's
 * architecture: Motion handles general UI, Anime.js is scoped to this
 * visualization only) — kept fully self-contained so that boundary never
 * blurs into other components.
 */
export default function BurlVisualization({ className = '' }) {
  const centerRef = useRef(null);
  const groupRef = useRef(null);
  const lineRefs = useRef([]);
  const nodeRefs = useRef([]);

  useEffect(() => {
    const lines = lineRefs.current.filter(Boolean);
    const nodes = nodeRefs.current.filter(Boolean);
    if (!centerRef.current || lines.length === 0) return;

    // Respect the OS-level "reduce motion" preference — show the finished
    // shape immediately instead of animating it in.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      lines.forEach((line) => { line.style.strokeDashoffset = '0'; });
      return;
    }

    // Set each line's real path length so the "draw" animation is accurate,
    // regardless of the exact radius/geometry used above.
    lines.forEach((line) => {
      const length = line.getTotalLength();
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
    });

    const tl = createTimeline({ defaults: { ease: 'outQuad' } });

    tl.add(centerRef.current, {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 400,
      ease: 'outElastic(1, .6)',
    })
      .add(
        lines,
        {
          strokeDashoffset: 0,
          duration: 350,
          delay: stagger(110),
        },
        '-=150'
      )
      .add(
        nodes,
        {
          scale: [0, 1],
          opacity: [0, 1],
          duration: 320,
          delay: stagger(110),
          ease: 'outBack',
        },
        '<'
      )
      .add(groupRef.current, {
        scale: [1, 1.05, 1],
        duration: 550,
      });

    return () => tl.pause();
  }, []);

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g ref={groupRef} style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
        {SATELLITES.map((pos, i) => (
          <line
            key={`line-${i}`}
            ref={(el) => { lineRefs.current[i] = el; }}
            x1={CENTER}
            y1={CENTER}
            x2={pos.x}
            y2={pos.y}
            stroke="#D0BCFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {SATELLITES.map((pos, i) => (
          <circle
            key={`node-${i}`}
            ref={(el) => { nodeRefs.current[i] = el; }}
            cx={pos.x}
            cy={pos.y}
            r={8}
            fill="#D0BCFF"
            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
          />
        ))}
        <circle
          ref={centerRef}
          cx={CENTER}
          cy={CENTER}
          r={14}
          fill="#D0BCFF"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
      </g>
    </svg>
  );
}

BurlVisualization.propTypes = {
  className: PropTypes.string,
};
