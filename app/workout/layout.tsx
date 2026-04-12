/**
 * Workout session layout.
 * The WorkoutContext provider will live here once implemented,
 * so all child routes (/, /rest, /complete) share session state.
 */
export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
