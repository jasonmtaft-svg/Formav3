/**
 * Arm orientated like the reference image:
 *   – fist pointing UP at top-centre
 *   – upper arm vertical, bicep peak bulging LEFT
 *   – forearm sweeping down-right from elbow
 *
 * ViewBox 32 × 36 to give the forearm room.
 * All variants share the same silhouette; A=filled, B=filled+bigger peak,
 * C=filled+definition line inside, D=outline stroke.
 */

const ARM_PATH =
  "M14 2 C12 2 11 4 12 6 C12 8 13 9 13 9 C10 10 7 13 6 16 C5 19 6 22 9 24 C11 25 13 26 14 26 C15 27 17 30 20 33 C21 34 23 35 25 34 C27 33 27 31 26 30 C24 28 22 26 21 25 C20 24 20 23 21 22 C22 20 22 16 22 11 C22 9 21 8 21 8 C22 7 23 5 22 3 C21 1 19 1 17 2 C16 2 15 2 14 2 Z";

// Exaggerated bicep — peak pushed further left
const ARM_PATH_BIG =
  "M15 2 C13 2 12 4 12 6 C12 8 13 9 13 9 C9 10 5 13 4 17 C3 21 5 24 9 26 C11 27 13 27 14 27 C15 28 17 31 20 34 C21 35 23 36 25 35 C27 34 27 32 26 31 C24 29 22 27 21 26 C20 25 20 24 21 23 C22 21 23 17 23 12 C23 9 22 8 21 8 C22 7 23 5 22 3 C21 1 19 1 18 2 C17 2 16 2 15 2 Z";

// Inner definition line separating bicep from forearm
const DEFINITION_LINE =
  "M9 24 C11 23 13 22 15 22 C17 22 19 23 21 25";

export default function LogoPreview() {
  const box = "0 0 32 36";

  return (
    <main className="min-h-dvh bg-bg px-6 py-12">
      <h1 className="text-xl font-semibold mb-2">Flex arm logo</h1>
      <p className="text-sm text-text-secondary mb-10">
        Fist up, bicep peak left, forearm sweeping right.
      </p>

      <div className="grid grid-cols-2 gap-8 max-w-xs">

        {/* A */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-surface border border-border-default flex items-center justify-center w-[108px] h-[120px]">
            <svg width="72" height="88" viewBox={box} fill="none">
              <path d={ARM_PATH} fill="#f5f5f5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text-primary text-center">A — Filled</p>
        </div>

        {/* B — bigger peak */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-surface border border-border-default flex items-center justify-center w-[108px] h-[120px]">
            <svg width="72" height="88" viewBox={box} fill="none">
              <path d={ARM_PATH_BIG} fill="#f5f5f5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text-primary text-center">B — Bigger peak</p>
        </div>

        {/* C — filled + definition line */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-surface border border-border-default flex items-center justify-center w-[108px] h-[120px]">
            <svg width="72" height="88" viewBox={box} fill="none">
              <path d={ARM_PATH} fill="#f5f5f5" />
              {/* Definition line separating bicep from forearm */}
              <path
                d={DEFINITION_LINE}
                stroke="#242424"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text-primary text-center">C — With detail line</p>
        </div>

        {/* D — outline only */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-surface border border-border-default flex items-center justify-center w-[108px] h-[120px]">
            <svg width="72" height="88" viewBox={box} fill="none">
              <path
                d={ARM_PATH}
                stroke="#f5f5f5"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text-primary text-center">D — Outline</p>
        </div>

      </div>

      {/* App icon mock */}
      <div className="mt-12 space-y-3">
        <p className="text-xs text-text-muted uppercase tracking-widest">App icon (A)</p>
        <div
          className="flex items-center justify-center"
          style={{
            width: 96, height: 96,
            background: "#1a1a1a",
            borderRadius: 22,
            border: "1px solid #333",
          }}
        >
          <svg width="52" height="62" viewBox={box} fill="none">
            <path d={ARM_PATH} fill="#f5f5f5" />
          </svg>
        </div>
      </div>
    </main>
  );
}
