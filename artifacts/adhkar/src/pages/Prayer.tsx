import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarPrayer } from "@/data/adhkar";

export default function Prayer() {
  const { t } = useTranslation();
  
  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkarPrayer} titleKey="nav.prayer" isEvening={false} />
    </div>
  );
}
