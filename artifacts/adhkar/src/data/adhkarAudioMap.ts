export interface AdhkarAudioConfig {
  type: "quran" | "dureihim";
  surah?: number;
  ayahs?: number[];
  filename?: string;
}

export const adhkarAudioMap: Record<string, AdhkarAudioConfig> = {
  "ayat_kursi_morning_evening": {
    "type": "quran",
    "surah": 2,
    "ayahs": [255]
  },
  "sayyid_istighfar": {
    "type": "dureihim",
    "filename": "79"
  },
  "la_ilaha_10": {
    "type": "dureihim",
    "filename": "93"
  },
  "subhan_allah_100": {
    "type": "dureihim",
    "filename": "91"
  },
  "bismillah_protection": {
    "type": "dureihim",
    "filename": "86"
  },
  "afia_dua": {
    "type": "dureihim",
    "filename": "84"
  },
  "ikhlas_morning_evening": {
    "type": "quran",
    "surah": 112,
    "ayahs": [1, 2, 3, 4]
  },
  "falaq_morning_evening": {
    "type": "quran",
    "surah": 113,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "nas_morning_evening": {
    "type": "quran",
    "surah": 114,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "raditu": {
    "type": "dureihim",
    "filename": "87"
  },
  "fatirul_samawat": {
    "type": "dureihim",
    "filename": "85"
  },
  "ya_hayyu": {
    "type": "dureihim",
    "filename": "88"
  },
  "hasbiyallah_7": {
    "type": "dureihim",
    "filename": "83"
  },
  "asbahna_morning": {
    "type": "dureihim",
    "filename": "77"
  },
  "fitra_morning": {
    "type": "dureihim",
    "filename": "90"
  },
  "la_ilaha_100_day": {
    "type": "dureihim",
    "filename": "93"
  },
  "awudhu_kalimat": {
    "type": "dureihim",
    "filename": "216"
  },
  "ayatan_baqarah": {
    "type": "quran",
    "surah": 2,
    "ayahs": [285, 286]
  },
  "ayat_kursi_sleep": {
    "type": "quran",
    "surah": 2,
    "ayahs": [255]
  },
  "akhir_baqarah_sleep": {
    "type": "quran",
    "surah": 2,
    "ayahs": [285, 286]
  },
  "ikhlas_sleep": {
    "type": "quran",
    "surah": 112,
    "ayahs": [1, 2, 3, 4]
  },
  "falaq_sleep": {
    "type": "quran",
    "surah": 113,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "nas_sleep": {
    "type": "quran",
    "surah": 114,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "subhan_allah_sleep_33": {
    "type": "dureihim",
    "filename": "240"
  },
  "allahu_akbar_sleep_34": {
    "type": "dureihim",
    "filename": "241"
  },
  "bismika_rabbi": {
    "type": "dureihim",
    "filename": "102"
  },
  "allahumma_bismika": {
    "type": "dureihim",
    "filename": "105"
  },
  "allahumma_khalaqta": {
    "type": "dureihim",
    "filename": "103"
  },
  "allahumma_rabb_samawat": {
    "type": "dureihim",
    "filename": "107"
  },
  "alhamdu_atamana": {
    "type": "dureihim",
    "filename": "108"
  },
  "allahumma_qini": {
    "type": "dureihim",
    "filename": "104"
  },
  "bismillah_wadatu": {
    "type": "dureihim",
    "filename": "102"
  },
  "allahumma_aslamtu": {
    "type": "dureihim",
    "filename": "111"
  },
  "istighfar_3_prayer": {
    "type": "dureihim",
    "filename": "66"
  },
  "la_ilaha_prayer": {
    "type": "dureihim",
    "filename": "67"
  },
  "tahlil_prayer": {
    "type": "dureihim",
    "filename": "68"
  },
  "ayat_kursi_prayer": {
    "type": "quran",
    "surah": 2,
    "ayahs": [255]
  },
  "subhan_allah_prayer_33": {
    "type": "dureihim",
    "filename": "240"
  },
  "allahu_akbar_prayer_33": {
    "type": "dureihim",
    "filename": "241"
  },
  "tamam_miah_prayer": {
    "type": "dureihim",
    "filename": "93"
  },
  "ikhlas_prayer": {
    "type": "quran",
    "surah": 112,
    "ayahs": [1, 2, 3, 4]
  },
  "falaq_prayer": {
    "type": "quran",
    "surah": 113,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "nas_prayer": {
    "type": "quran",
    "surah": 114,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "salawat_100_prayer": {
    "type": "dureihim",
    "filename": "98"
  },
  "salawat_ibrahimiya_prayer": {
    "type": "dureihim",
    "filename": "53"
  },
  "fatiha_ruqyah": {
    "type": "quran",
    "surah": 1,
    "ayahs": [1, 2, 3, 4, 5, 6, 7]
  },
  "ayat_kursi_ruqyah": {
    "type": "quran",
    "surah": 2,
    "ayahs": [255]
  },
  "aman_rasul_ruqyah": {
    "type": "quran",
    "surah": 2,
    "ayahs": [285, 286]
  },
  "kafirun_ruqyah": {
    "type": "quran",
    "surah": 109,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "ikhlas_ruqyah": {
    "type": "quran",
    "surah": 112,
    "ayahs": [1, 2, 3, 4]
  },
  "falaq_ruqyah": {
    "type": "quran",
    "surah": 113,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "nas_ruqyah": {
    "type": "quran",
    "surah": 114,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "awudhu_qudra": {
    "type": "dureihim",
    "filename": "243"
  },
  "awudhu_kalimat_ruqyah": {
    "type": "dureihim",
    "filename": "146"
  },
  "salawat_100": {
    "type": "dureihim",
    "filename": "98"
  },
  "salawat_ibrahimiya": {
    "type": "dureihim",
    "filename": "53"
  },
  "sv1": {
    "type": "dureihim",
    "filename": "219"
  },
  "sv3": {
    "type": "dureihim",
    "filename": "221"
  },
  "sv4": {
    "type": "dureihim",
    "filename": "220"
  },
  "sv5": {
    "type": "quran",
    "surah": 33,
    "ayahs": [56]
  },
  "enter_house_bismillah": {
    "type": "dureihim",
    "filename": "18"
  },
  "leave_house_tawakkul": {
    "type": "dureihim",
    "filename": "16"
  },
  "leave_house_dua": {
    "type": "dureihim",
    "filename": "17"
  },
  "house_taawwudh_night": {
    "type": "dureihim",
    "filename": "216"
  },
  "house_bismillah_shaytan": {
    "type": "dureihim",
    "filename": "12"
  },
  "go_to_masjid_noor": {
    "type": "dureihim",
    "filename": "19"
  },
  "enter_masjid_dua": {
    "type": "dureihim",
    "filename": "20"
  },
  "enter_masjid_istiaadha": {
    "type": "dureihim",
    "filename": "20"
  },
  "leave_masjid_dua": {
    "type": "dureihim",
    "filename": "21"
  }
};
