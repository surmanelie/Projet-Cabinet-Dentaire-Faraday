import { LogoMark } from "@/components/Logo";
import SmartClock from "./SmartClock";

export default function PointerPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ardoise-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <LogoMark size={46} />
        </div>
        <SmartClock />
      </div>
    </div>
  );
}
