import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarRuqyah } from "@/data/adhkar";

export default function Ruqyah() {
  const { t } = useTranslation();
  
  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkarRuqyah} titleKey="nav.ruqyah" isEvening={false} />
    </div>
  );
}
