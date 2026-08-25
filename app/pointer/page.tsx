import { LogoMark } from "@/components/Logo";
import SmartClock from "./SmartClock";

export default function PointerPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ardoise-50 p-4">
      <div className="w-full max-w-sm rounded-md border border-ardoise-200 bg-white p-10">
        <div className="mb-8 flex justify-center">
          <LogoMark size={44} />
        </div>
        <SmartClock />
      </div>
    </div>
  );
}
