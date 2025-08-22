import { Clapperboard } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <Clapperboard className="text-brand" />
      <span className="font-display text-xl tracking-wide">Actory</span>
    </div>
  );
}
