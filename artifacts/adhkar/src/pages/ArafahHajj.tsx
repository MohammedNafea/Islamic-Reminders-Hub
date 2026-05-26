import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarArafahHajj } from "@/data/adhkar";

export default function ArafahHajj() {
  useTranslation();
  
  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkarArafahHajj} titleKey="nav.arafah_hajj" isEvening={false} />
    </div>
  );
}
