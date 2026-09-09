import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomPanViewportProps {
  children: React.ReactNode;
  /** Bumping this (e.g. on template change) recenters and resets zoom. */
  resetKey?: string | number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

const CLICK_DRAG_THRESHOLD = 6; // px of movement before a pointer-down counts as a drag, not a click

/**
 * A fixed-height, non-scrolling viewport that lets the family tree be panned and zoomed instead —
 * wheel/trackpad zoom, click-and-drag pan, two-finger pinch-to-zoom on touch, and keyboard support
 * (arrow keys to pan, +/- to zoom, 0 to reset) for people who can't use a mouse or touch a screen.
 */
export const ZoomPanViewport: React.FC<ZoomPanViewportProps> = ({
  children,
  resetKey,
  minZoom = 0.4,
  maxZoom = 2.5,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // The scale at which the *entire* tree fits inside the viewport with no
  // cropping. Recomputed whenever the container or the tree's own natural
  // (unscaled) size changes — e.g. a new generation is added, or branches
  // are merged in. `userAdjustedRef` tracks whether the person has since
  // zoomed/panned by hand, so we don't fight their manual adjustments.
  const [fitScale, setFitScale] = useState(1);
  const userAdjustedRef = useRef(false);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: number } | null>(null);
  const pinchState = useRef<{ startDist: number; startScale: number } | null>(null);
  const justDraggedRef = useRef(false);

  // The floor a person can zoom OUT to must never be tighter than what's needed to
  // see the whole tree — otherwise a wide/tall tree gets stuck larger than the frame
  // and its outer branches are permanently cropped by the viewport's overflow-hidden.
  const clampUserScale = useCallback(
    (s: number) => Math.min(maxZoom, Math.max(Math.min(minZoom, fitScale), s)),
    [minZoom, maxZoom, fitScale]
  );

  const resetView = useCallback(() => {
    userAdjustedRef.current = false;
    setScale(fitScale);
    setPan({ x: 0, y: 0 });
  }, [fitScale]);

  // Measure the tree's real, unscaled size vs. the visible frame, and keep
  // the whole thing fitted by default so no branch is ever cropped off —
  // "100%" now means "the whole tree", not "the whole tree only if it
  // happens to be small enough for the frame".
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const PADDING_FACTOR = 0.94; // small margin so edge members aren't flush against the frame
    // Measure the tree's own element (the flex wrapper's single child), not the
    // flex wrapper itself — with centered content, the wrapper's scrollWidth can
    // under-report overflow that extends symmetrically past both edges.
    const target = (content.firstElementChild as HTMLElement | null) ?? content;

    const recompute = () => {
      const containerRect = container.getBoundingClientRect();
      const contentWidth = target.offsetWidth;
      const contentHeight = target.offsetHeight;
      if (contentWidth === 0 || contentHeight === 0) return;

      // Deliberately NOT run through clampScale here: the whole point of "fit" is
      // to show every branch, even if that means going below the nominal minZoom
      // for a large tree. minZoom only limits how far a person can zoom in/out
      // manually from there (see clampUserScale above). A tiny absolute floor
      // (0.05) just guards against a NaN/zero-division edge case, not real trees.
      const nextFit = Math.max(
        0.05,
        Math.min(
          maxZoom,
          1,
          (containerRect.width / contentWidth) * PADDING_FACTOR,
          (containerRect.height / contentHeight) * PADDING_FACTOR
        )
      );
      setFitScale(nextFit);
      if (!userAdjustedRef.current) {
        setScale(nextFit);
        setPan({ x: 0, y: 0 });
      }
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    observer.observe(target);
    return () => observer.disconnect();
  }, [maxZoom, resetKey]);

  // Recenter (to the fitted view) whenever the underlying tree template changes.
  useEffect(() => {
    userAdjustedRef.current = false;
  }, [resetKey]);

  const zoomBy = (delta: number, centerX?: number, centerY?: number) => {
    userAdjustedRef.current = true;
    setScale((prev) => clampUserScale(prev + delta));
    void centerX;
    void centerY;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    userAdjustedRef.current = true;
    const delta = -e.deltaY * 0.0015;
    setScale((prev) => clampUserScale(prev + delta));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: 0 };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = { startDist: dist, startScale: scale };
      dragState.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinchState.current.startDist || 1);
      userAdjustedRef.current = true;
      setScale(clampUserScale(pinchState.current.startScale * ratio));
      return;
    }

    if (dragState.current) {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      dragState.current.moved = Math.max(dragState.current.moved, Math.hypot(dx, dy));
      if (dragState.current.moved > CLICK_DRAG_THRESHOLD) userAdjustedRef.current = true;
      setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (dragState.current && dragState.current.moved > CLICK_DRAG_THRESHOLD) {
      justDraggedRef.current = true;
    }
    if (pointers.current.size < 2) pinchState.current = null;
    if (pointers.current.size === 0) dragState.current = null;
  };

  // Swallow the click that follows a real drag so member cards aren't accidentally "tapped".
  const handleClickCapture = (e: React.MouseEvent) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const PAN_STEP = 40;
    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        zoomBy(0.15);
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomBy(-0.15);
        break;
      case '0':
        e.preventDefault();
        resetView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        userAdjustedRef.current = true;
        setPan((p) => ({ ...p, y: p.y + PAN_STEP }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        userAdjustedRef.current = true;
        setPan((p) => ({ ...p, y: p.y - PAN_STEP }));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        userAdjustedRef.current = true;
        setPan((p) => ({ ...p, x: p.x + PAN_STEP }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        userAdjustedRef.current = true;
        setPan((p) => ({ ...p, x: p.x - PAN_STEP }));
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Family tree, zoomable and pannable. Use arrow keys to pan, plus and minus to zoom, 0 to reset."
      tabIndex={0}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
      className={`relative h-[62vh] min-h-[420px] max-h-[720px] w-full overflow-hidden rounded-2xl touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold-500 ${className}`}
      style={{ cursor: dragState.current ? 'grabbing' : 'grab' }}
    >
      <div
        ref={contentRef}
        className="absolute inset-0 flex items-center justify-center origin-center transition-transform duration-75 will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        {children}
      </div>

      {/* Zoom / reset controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border bg-white/95 dark:bg-heritage-dark-card/95 backdrop-blur p-1.5 shadow-soft-lg">
        <button
          type="button"
          onClick={() => zoomBy(0.2)}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-heritage-green-800 dark:text-heritage-dark-text hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-0.2)}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-heritage-green-800 dark:text-heritage-dark-text hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset zoom and position"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-heritage-green-800 dark:text-heritage-dark-text hover:bg-heritage-cream-200 dark:hover:bg-heritage-dark-hover"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-20 rounded-full bg-white/90 dark:bg-heritage-dark-card/90 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-heritage-green-700 dark:text-heritage-dark-muted border border-heritage-cream-400 dark:border-heritage-dark-border">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};
