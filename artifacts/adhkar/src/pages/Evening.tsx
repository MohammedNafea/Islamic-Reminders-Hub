import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarMorningEvening, adhkarMorningVariant, adhkarEveningOnly } from "@/data/adhkar";

export default function Evening() {
  useTranslation();
  
  // Combine all evening adhkar
  const adhkar = [
    ...adhkarMorningEvening,
    ...adhkarMorningVariant,
    ...adhkarEveningOnly,
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkar} titleKey="nav.evening" isEvening={true} />
    </div>
  );
}
