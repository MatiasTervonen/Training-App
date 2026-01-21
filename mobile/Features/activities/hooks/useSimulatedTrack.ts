// hooks/useSimulatedTrack.ts
import { useEffect, useRef } from "react";
import { TrackPoint } from "@/types/session";

const SIMULATED_ROUTE: [number, number][] = [
    [24.0660, 60.2505], // Start near Sauvonrinne
    [24.0665, 60.2510],
    [24.0672, 60.2515],
    [24.0680, 60.2520],
    [24.0688, 60.2525],
    [24.0695, 60.2530],
    [24.0702, 60.2535],
    [24.0710, 60.2540],
    [24.0718, 60.2545],
    [24.0725, 60.2550],
    [24.0732, 60.2555],
    [24.0740, 60.2560],
];

export function useSimulatedTrack(
    enabled: boolean,
    onNewPoint: (point: TrackPoint) => void
) {
    const indexRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(() => {
            const coords = SIMULATED_ROUTE[indexRef.current % SIMULATED_ROUTE.length];

            const fakePoint: TrackPoint = {
                latitude: coords[1],
                longitude: coords[0],
                timestamp: Date.now(),
                accuracy: 10,
                isStationary: false,
            };

            console.log("Simulated point:", indexRef.current, fakePoint);
            onNewPoint(fakePoint);
            indexRef.current++;
        }, 2000); // New point every 2 seconds

        return () => clearInterval(interval);
    }, [enabled, onNewPoint]);
}