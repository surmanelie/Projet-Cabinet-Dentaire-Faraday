import { getSession } from "@/lib/auth";
import ClockButton from "./ClockButton";

const VALID_ACTIONS = ["debut", "pause-debut", "pause-fin", "fin"] as const;

export default async function PointagePage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;
  const session = await getSession();

  const isValid = VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        {/* En-tête */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-faraday-600 text-sm font-semibold text-white">
            CF
          </div>
          {session && (
            <p className="text-sm text-ardoise-400">
              Connecté·e en tant que{" "}
              <span className="font-medium text-ardoise-700">
                {session.firstName} {session.lastName}
              </span>
            </p>
          )}
        </div>

        {isValid ? (
          <ClockButton action={action} />
        ) : (
          <div className="text-center space-y-3">
            <p className="text-3xl">❌</p>
            <p className="font-semibold text-red-700">QR code invalide</p>
            <p className="text-sm text-ardoise-500">
              Contactez l&apos;administrateur pour obtenir un nouveau QR code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
