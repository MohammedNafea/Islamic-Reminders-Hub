import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarMorningEvening, adhkarMorningVariant, adhkarMorningOnly } from "@/data/adhkar";

export default function Morning() {
  useTranslation();
  
  // Combine all morning adhkar
  const adhkar = [
    ...adhkarMorningEvening,
    ...adhkarMorningVariant,
    ...adhkarMorningOnly,
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkar} titleKey="nav.morning" isEvening={false} />
    </div>
  );
}
