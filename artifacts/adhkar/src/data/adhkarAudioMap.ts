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
  },
  "afia_body_hearing_sight": {
    "type": "dureihim",
    "filename": "82"
  },
  "istighfar_100_daily": {
    "type": "dureihim",
    "filename": "96"
  },
  "bika_asbahna": {
    "type": "dureihim",
    "filename": "78"
  },
  "niamah_morning": {
    "type": "dureihim",
    "filename": "81"
  },
  "subhan_allah_adada_khalqihi": {
    "type": "dureihim",
    "filename": "94"
  },
  "ashhadu_himalata_arshika": {
    "type": "dureihim",
    "filename": "80"
  },
  "alhamdulillah_sleep_33": {
    "type": "dureihim",
    "filename": "91"
  },
  "sleep_taqallub": {
    "type": "dureihim",
    "filename": "112"
  },
  "sleep_faza": {
    "type": "dureihim",
    "filename": "245"
  },
  "sleep_faza_istiaadha": {
    "type": "dureihim",
    "filename": "113"
  },
  "sleep_bad_dream": {
    "type": "dureihim",
    "filename": "114"
  },
  "sleep_waking_up_1": {
    "type": "dureihim",
    "filename": "1"
  },
  "sleep_waking_up_2": {
    "type": "dureihim",
    "filename": "3"
  },
  "sleep_mulk_sajdah": {
    "type": "quran",
    "surah": 67,
    "ayahs": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  },
  "sleep_ali_imran_waking": {
    "type": "quran",
    "surah": 3,
    "ayahs": [190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200]
  },
  "sleep_kafirun_recitation": {
    "type": "quran",
    "surah": 109,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "sleep_insomnia_dua": {
    "type": "dureihim",
    "filename": "91"
  },
  "alhamdulillah_prayer_33": {
    "type": "dureihim",
    "filename": "91"
  },
  "prayer_qini_v1": {
    "type": "dureihim",
    "filename": "104"
  },
  "prayer_istiaadha_bukhari": {
    "type": "dureihim",
    "filename": "60"
  },
  "prayer_istighfar_khataaya": {
    "type": "dureihim",
    "filename": "91"
  },
  "prayer_aanni_ala_dhikrika": {
    "type": "dureihim",
    "filename": "59"
  },
  "prayer_ilm_nafi": {
    "type": "dureihim",
    "filename": "95"
  },
  "prayer_la_ilaha_yuhyi_10": {
    "type": "dureihim",
    "filename": "209"
  },
  "prayer_ajirni_min_nar_7": {
    "type": "dureihim",
    "filename": "61"
  },
  "prayer_tasbih_10_alternate": {
    "type": "dureihim",
    "filename": "106"
  },
  "prayer_tasbih_34_alternate": {
    "type": "dureihim",
    "filename": "91"
  },
  "prayer_tasbih_25_alternate": {
    "type": "dureihim",
    "filename": "264"
  },
  "rabb_nas": {
    "type": "quran",
    "surah": 114,
    "ayahs": [1, 2, 3, 4, 5, 6]
  },
  "ruqyah_jibril": {
    "type": "dureihim",
    "filename": "91"
  },
  "ruqyah_rubb_nas_bidal_shifa": {
    "type": "dureihim",
    "filename": "91"
  },
  "ruqyah_jibril_alternate": {
    "type": "dureihim",
    "filename": "178"
  },
  "ruqyah_bismillah_turbat_ardina": {
    "type": "dureihim",
    "filename": "18"
  },
  "ruqyah_muawwidhat_blow": {
    "type": "dureihim",
    "filename": "91"
  },
  "ruqyah_baqarah_intro": {
    "type": "quran",
    "surah": 2,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "ruqyah_sihr_arafah": {
    "type": "quran",
    "surah": 7,
    "ayahs": [117, 118, 119, 120, 121, 122]
  },
  "ruqyah_sihr_yunus": {
    "type": "quran",
    "surah": 10,
    "ayahs": [81, 82]
  },
  "ruqyah_sihr_taha": {
    "type": "quran",
    "surah": 20,
    "ayahs": [69]
  },
  "ruqyah_ain_qalam": {
    "type": "quran",
    "surah": 68,
    "ayahs": [51, 52]
  },
  "ruqyah_yabrik": {
    "type": "dureihim",
    "filename": "178"
  },
  "ruqyah_faza_shayatin": {
    "type": "dureihim",
    "filename": "113"
  },
  "ruqyah_khambash": {
    "type": "dureihim",
    "filename": "247"
  },
  "ruqyah_jibril_self": {
    "type": "dureihim",
    "filename": "91"
  },
  "ruqyah_khalaq": {
    "type": "quran",
    "surah": 113,
    "ayahs": [1, 2, 3, 4, 5]
  },
  "ruqyah_bismillah_protection": {
    "type": "dureihim",
    "filename": "86"
  },
  "sv2": {
    "type": "dureihim",
    "filename": "91"
  },
  "wear_clothes": {
    "type": "dureihim",
    "filename": "5"
  },
  "wear_clothes_general": {
    "type": "dureihim",
    "filename": "5"
  },
  "take_off_clothes": {
    "type": "dureihim",
    "filename": "15"
  },
  "enter_restroom": {
    "type": "dureihim",
    "filename": "10"
  },
  "leave_restroom": {
    "type": "dureihim",
    "filename": "11"
  },
  "before_wudu": {
    "type": "dureihim",
    "filename": "12"
  },
  "after_wudu": {
    "type": "dureihim",
    "filename": "13"
  },
  "after_wudu_tawabeen": {
    "type": "dureihim",
    "filename": "13"
  },
  "hear_athan_repeat": {
    "type": "dureihim",
    "filename": "22"
  },
  "after_athan_salawat": {
    "type": "dureihim",
    "filename": "24"
  },
  "after_athan_wasilah": {
    "type": "dureihim",
    "filename": "25"
  },
  "after_athan_shahada": {
    "type": "dureihim",
    "filename": "23"
  },
  "before_food": {
    "type": "dureihim",
    "filename": "175"
  },
  "after_food": {
    "type": "dureihim",
    "filename": "178"
  },
  "after_food_hamd_general": {
    "type": "dureihim",
    "filename": "178"
  },
  "after_milk_dua": {
    "type": "dureihim",
    "filename": "179"
  },
  "food_guest_dua": {
    "type": "dureihim",
    "filename": "182"
  },
  "food_provider_dua": {
    "type": "dureihim",
    "filename": "183"
  },
  "food_breaking_fast_host": {
    "type": "dureihim",
    "filename": "184"
  },
  "vehicle_mount_dua": {
    "type": "dureihim",
    "filename": "206"
  },
  "travel_start": {
    "type": "dureihim",
    "filename": "207"
  },
  "enter_town": {
    "type": "dureihim",
    "filename": "209"
  },
  "travel_return": {
    "type": "dureihim",
    "filename": "211"
  },
  "traveler_to_resident": {
    "type": "dureihim",
    "filename": "212"
  },
  "resident_to_traveler": {
    "type": "dureihim",
    "filename": "213"
  },
  "travel_takbeer_tasbih": {
    "type": "dureihim",
    "filename": "214"
  },
  "travel_tewdeea_resident": {
    "type": "dureihim",
    "filename": "213"
  },
  "travel_mount_fail": {
    "type": "dureihim",
    "filename": "206"
  },
  "travel_sahar": {
    "type": "dureihim",
    "filename": "215"
  },
  "prayer_istiftah_1": {
    "type": "dureihim",
    "filename": "27"
  },
  "prayer_istiftah_2": {
    "type": "dureihim",
    "filename": "28"
  },
  "prayer_ruku_2": {
    "type": "dureihim",
    "filename": "35"
  },
  "prayer_ruku_3": {
    "type": "dureihim",
    "filename": "34"
  },
  "prayer_raf_ruku": {
    "type": "dureihim",
    "filename": "39"
  },
  "prayer_sujud_2": {
    "type": "dureihim",
    "filename": "46"
  },
  "prayer_sujud_3": {
    "type": "dureihim",
    "filename": "44"
  },
  "prayer_between_sujud": {
    "type": "dureihim",
    "filename": "48"
  },
  "prayer_between_sujud_2": {
    "type": "dureihim",
    "filename": "49"
  },
  "prayer_tashahhud_text": {
    "type": "dureihim",
    "filename": "52"
  },
  "prayer_before_tasleem_1": {
    "type": "dureihim",
    "filename": "56"
  },
  "prayer_before_tasleem_2": {
    "type": "dureihim",
    "filename": "57"
  },
  "prayer_sujud_tilawah": {
    "type": "dureihim",
    "filename": "50"
  },
  "social_sneezing": {
    "type": "dureihim",
    "filename": "189"
  },
  "social_married": {
    "type": "dureihim",
    "filename": "190"
  },
  "social_anger": {
    "type": "dureihim",
    "filename": "191"
  },
  "social_afflicted": {
    "type": "dureihim",
    "filename": "194"
  },
  "social_market": {
    "type": "dureihim",
    "filename": "210"
  },
  "social_condolence": {
    "type": "dureihim",
    "filename": "162"
  },
  "social_sick_visit_1": {
    "type": "dureihim",
    "filename": "147"
  },
  "social_sick_visit_2": {
    "type": "dureihim",
    "filename": "148"
  },
  "social_wear_new_clothes_1": {
    "type": "dureihim",
    "filename": "7"
  },
  "social_wear_new_clothes_2": {
    "type": "dureihim",
    "filename": "8"
  },
  "nature_rain_start": {
    "type": "dureihim",
    "filename": "172"
  },
  "nature_rain_after": {
    "type": "dureihim",
    "filename": "173"
  },
  "nature_thunder": {
    "type": "dureihim",
    "filename": "168"
  },
  "nature_wind": {
    "type": "dureihim",
    "filename": "167"
  },
  "nature_crescent": {
    "type": "dureihim",
    "filename": "174"
  },
  "occasion_laylat_al_qadr": {
    "type": "dureihim",
    "filename": "84"
  },
  "occasion_arafah_best_dhikr": {
    "type": "dureihim",
    "filename": "77"
  },
  "occasion_arafah_ali_dua": {
    "type": "dureihim",
    "filename": "84"
  },
  "occasion_laylat_al_qadr_dua_maghfirah": {
    "type": "dureihim",
    "filename": "84"
  },
  "occasion_laylat_al_qadr_tahajjud": {
    "type": "dureihim",
    "filename": "84"
  },
  "occasion_arafah_tahlil_takbeer": {
    "type": "dureihim",
    "filename": "93"
  },
  "occasion_arafah_dua_anbiya": {
    "type": "dureihim",
    "filename": "84"
  },
  "protection_children_family": {
    "type": "dureihim",
    "filename": "146"
  },
  "protection_entire_creation": {
    "type": "dureihim",
    "filename": "247"
  },
  "protection_body_injury": {
    "type": "dureihim",
    "filename": "84"
  },
  "protection_sleep_fears": {
    "type": "dureihim",
    "filename": "113"
  },
  "protection_entry_exit_plague": {
    "type": "dureihim",
    "filename": "10"
  },
  "protection_envy_evil_eye": {
    "type": "dureihim",
    "filename": "178"
  },
  "protection_dhikr_waswas": {
    "type": "dureihim",
    "filename": "134"
  },
  "protection_anxiety_grief": {
    "type": "dureihim",
    "filename": "121"
  },
  "sunnah_bed_shake": {
    "type": "dureihim",
    "filename": "102"
  },
  "sunnah_lick_fingers": {
    "type": "dureihim",
    "filename": "178"
  },
  "sunnah_wudu_prayer": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_istikhara_dua": {
    "type": "dureihim",
    "filename": "74"
  },
  "sunnah_travel_tasbih_takbeer": {
    "type": "dureihim",
    "filename": "106"
  },
  "sunnah_sit_drink": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_salat_nafilah_house": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_tahiyyat_masjid": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_sleep_wudu": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_tahajjud_siwak": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_sujood_shukr": {
    "type": "dureihim",
    "filename": "242"
  },
  "sunnah_covering_vessels": {
    "type": "dureihim",
    "filename": "91"
  },
  "sunnah_greeting_children": {
    "type": "dureihim",
    "filename": "163"
  },
  "sunnah_smile": {
    "type": "dureihim",
    "filename": "91"
  },
  "great_days_qadr": {
    "type": "dureihim",
    "filename": "121"
  },
  "great_days_arafah": {
    "type": "dureihim",
    "filename": "122"
  },
  "great_days_ashura": {
    "type": "dureihim",
    "filename": "115"
  },
  "great_days_dhul_hijjah": {
    "type": "dureihim",
    "filename": "125"
  },
  "great_days_friday": {
    "type": "dureihim",
    "filename": "118"
  },
  "great_days_sayyid_istighfar": {
    "type": "dureihim",
    "filename": "79"
  }
};
