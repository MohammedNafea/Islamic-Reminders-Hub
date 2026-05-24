class HijriHelper {
  static String getHijriDate(DateTime date, String langCode) {
    // Julian Day calculation
    int year = date.year;
    int month = date.month;
    int day = date.day;
    
    if (month < 3) {
      year -= 1;
      month += 12;
    }
    
    int a = (14 - month) ~/ 12;
    int y = year + 4800 - a;
    int m = month + 12 * a - 3;
    
    int jd = day + ((153 * m + 2) ~/ 5) + 365 * y + (y ~/ 4) - (y ~/ 100) + (y ~/ 400) - 32045;
    
    // Convert Julian Day to Hijri
    int l = jd - 1948440 + 10632;
    int n = (l - 1) ~/ 10631;
    l = l - 10631 * n + 354;
    int j = ((10985 - l) ~/ 5316) * ((50 * l) ~/ 17719) + ((l) ~/ 5670) * ((43 * l) ~/ 15238);
    l = l - ((30 - j) ~/ 15) * ((17719 * j) ~/ 50) - ((j) ~/ 16) * ((15238 * j) ~/ 43) + 29;
    
    int hijriMonth = (24 * l) ~/ 709;
    int hijriDay = l - (709 * hijriMonth) ~/ 24;
    int hijriYear = 30 * n + j - 30;
    
    final monthsAr = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    final monthsEn = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
      'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
    ];
    
    final monthsAm = [
      'ሙሀረም', 'ሰፈር', 'ረቢዐል አወል', 'ረቢዐ ሳኒ', 'ጀማዱል አወል', 'ጀማዱ ሳኒ',
      'ረጀብ', 'ሻዕባን', 'ረመዳን', 'ሸዋል', 'ዙልቂዳህ', 'ዙልሂጃህ'
    ];
    
    if (langCode == 'en') {
      return "$hijriDay ${monthsEn[hijriMonth - 1]} $hijriYear AH";
    } else if (langCode == 'am') {
      return "$hijriDay ${monthsAm[hijriMonth - 1]} $hijriYear ሂጅራ";
    } else {
      return "$hijriDay ${monthsAr[hijriMonth - 1]} $hijriYear هـ";
    }
  }
}
