"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getLatestWorkoutAction } from "@/actions/get-latest-workout";
import type { WeightUnit, WorkoutSession, SetLog } from "@/lib/types";

interface WorkoutContextValue {
  session: WorkoutSession | null;
  completedWorkoutId: string | null;
  isLoading: boolean;
  loadError: string | null;
  weightUnit: WeightUnit;
  prMap: Record<string, number>;
  updateLog: (supersetIndex: number, slot: "a" | "b", log: SetLog) => void;
  advanceSuperset: () => void;
  retryLoad: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [prMap, setPrMap] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);

    getLatestWorkoutAction()
      .then((result) => {
        if (result) {
          setWeightUnit(result.weightUnit);
          setPrMap(result.prMap);
          if (result.completed) {
            setCompletedWorkoutId(result.workoutId);
          } else {
            setSession({
              plan: result.plan,
              workoutId: result.workoutId,
              currentSupersetIndex: 0,
              logs: result.plan.supersets.map(() => ({
                a: { weightKg: "", reps: "" },
                b: { weightKg: "", reps: "" },
              })),
            });
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        setLoadError("Couldn't load your workout. Tap retry.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLog = useCallback(
    (supersetIndex: number, slot: "a" | "b", log: SetLog) => {
      setSession((prev) => {
        if (!prev) return prev;
        const logs = [...prev.logs];
        logs[supersetIndex] = { ...logs[supersetIndex], [slot]: log };
        return { ...prev, logs };
      });
    },
    [],
  );

  const advanceSuperset = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentSupersetIndex: prev.currentSupersetIndex + 1,
      };
    });
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        session,
        completedWorkoutId,
        isLoading,
        loadError,
        weightUnit,
        prMap,
        updateLog,
        advanceSuperset,
        retryLoad: load,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
}
