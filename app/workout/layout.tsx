import { WorkoutProvider } from "@/lib/workout-context";

export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkoutProvider>{children}</WorkoutProvider>;
}
