import { useTranslation } from "react-i18next";
import { DhikrList } from "@/components/DhikrList";
import { adhkarSleep } from "@/data/adhkar";

export default function Sleep() {
  const { t } = useTranslation();
  
  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList adhkar={adhkarSleep} titleKey="nav.sleep" isEvening={true} />
    </div>
  );
}
