import { DhikrList } from "@/components/DhikrList";
import { 
  adhkarMorningEvening, 
  adhkarMorningVariant, 
  adhkarMorningOnly, 
  adhkarEveningOnly,
  adhkarRuqyah 
} from "@/data/adhkar";
import { useRoute } from "wouter";

export default function MergedDhikr() {
  const [matchMorning] = useRoute("/morning-ruqyah");
  
  const isMorning = !!matchMorning;
  
  // Base adhkar
  const baseAdhkar = isMorning 
    ? [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarMorningOnly]
    : [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarEveningOnly];

  // Merge with Ruqyah, avoiding duplicates by Arabic text
  const merged = [...baseAdhkar];
  
  adhkarRuqyah.forEach(ruqyahItem => {
    const isDuplicate = baseAdhkar.some(baseItem => {
      // Check for similarity in text (ignore whitespace and special chars)
      const cleanBase = baseItem.arabic.replace(/[^\u0621-\u064A]/g, "");
      const cleanRuqyah = ruqyahItem.arabic.replace(/[^\u0621-\u064A]/g, "");
      return cleanBase === cleanRuqyah || cleanBase.includes(cleanRuqyah) || cleanRuqyah.includes(cleanBase);
    });
    
    if (!isDuplicate) {
      merged.push(ruqyahItem);
    }
  });

  return (
    <div className="animate-in fade-in duration-500">
      <DhikrList 
        adhkar={merged} 
        titleKey={isMorning ? "nav.merged_morning" : "nav.merged_evening"} 
        isEvening={!isMorning} 
      />
    </div>
  );
}
