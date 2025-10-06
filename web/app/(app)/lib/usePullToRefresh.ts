import { useRef, useState, useEffect } from "react";
import { handleError } from "../utils/handleError";

export default function usePullToRefresh({
  onRefresh,
  treshold = 120, // Minimum distance to trigger refresh
  maxPull = 120, // Maximum distance to pull
}: {
  onRefresh: () => void;
  treshold?: number;
  maxPull?: number;
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0 && !refreshing && el.scrollTop <= 0) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        directionLocked.current = null;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        !isDragging.current ||
        startY.current === null ||
        startX.current === null
      )
        return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const deltaX = Math.abs(currentX - startX.current);
      const deltaY = Math.abs(currentY - startY.current);

      // Lock direction if not already locked
      if (!directionLocked.current) {
        directionLocked.current = deltaY > deltaX ? "vertical" : "horizontal";
      }

      // If it's horizontal, ignore pull-to-refresh
      if (directionLocked.current !== "vertical") return;

      const distance = currentY - startY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance, maxPull));
      }
    };

    const handleTouchEnd = async () => {
      if (directionLocked.current === "vertical" && pullDistance >= treshold) {
        setRefreshing(true);

        try {
          await onRefresh();
        } catch (error) {
          handleError(error, {
            message: "Error during pull-to-refresh",
            method: "POST",
          });
        }
        setRefreshing(false);
        setPullDistance(0);
      } else {
        setPullDistance(0);
      }

      setPullDistance(0);
      setRefreshing(false);
      isDragging.current = false;
      startX.current = null;
      startY.current = null;
      directionLocked.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [maxPull, onRefresh, treshold, refreshing, pullDistance]);

  return { containerRef, pullDistance, refreshing };
}
