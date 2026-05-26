import 'package:hive_flutter/hive_flutter.dart';

class AppStorage {
  static late Box _settingsBox;
  static late Box _trackerBox;
  static late Box _favoritesBox;

  static Future<void> init() async {
    await Hive.initFlutter();
    _settingsBox = await Hive.openBox('settings');
    _trackerBox = await Hive.openBox('tracker');
    _favoritesBox = await Hive.openBox('favorites');
  }

  static void setBoxesForTesting(Box settings, Box tracker, Box favorites) {
    _settingsBox = settings;
    _trackerBox = tracker;
    _favoritesBox = favorites;
  }

  // Settings
  static String getLanguage() => _settingsBox.get('language', defaultValue: 'ar');
  static Future<void> setLanguage(String code) => _settingsBox.put('language', code);

  static String getThemeMode() => _settingsBox.get('themeMode', defaultValue: 'light');
  static Future<void> setThemeMode(String mode) => _settingsBox.put('themeMode', mode);

  static double getFontSizeScale() => _settingsBox.get('fontSizeScale', defaultValue: 1.0);
  static Future<void> setFontSizeScale(double scale) => _settingsBox.put('fontSizeScale', scale);

  static double? getLatOverride() => _settingsBox.get('latOverride');
  static double? getLngOverride() => _settingsBox.get('lngOverride');
  static String? getCityOverride() => _settingsBox.get('cityOverride');

  static Future<void> setLocationOverride(double lat, double lng, String city) async {
    await _settingsBox.put('latOverride', lat);
    await _settingsBox.put('lngOverride', lng);
    await _settingsBox.put('cityOverride', city);
  }

  static Future<void> clearLocationOverride() async {
    await _settingsBox.delete('latOverride');
    await _settingsBox.delete('lngOverride');
    await _settingsBox.delete('cityOverride');
  }

  static int getTasbihTarget() => _settingsBox.get('tasbihTarget', defaultValue: 33);
  static Future<void> setTasbihTarget(int target) => _settingsBox.put('tasbihTarget', target);

  static bool getTasbihVibrate() => _settingsBox.get('tasbihVibrate', defaultValue: true);
  static Future<void> setTasbihVibrate(bool value) => _settingsBox.put('tasbihVibrate', value);

  static bool getTasbihSound() => _settingsBox.get('tasbihSound', defaultValue: false);
  static Future<void> setTasbihSound(bool value) => _settingsBox.put('tasbihSound', value);

  // Salawat counts
  static int getSalawatCount() {
    final today = _getTodayKey();
    return _trackerBox.get('salawat_$today', defaultValue: 0);
  }
  static Future<void> incrementSalawat() async {
    final today = _getTodayKey();
    final current = getSalawatCount();
    await _trackerBox.put('salawat_$today', current + 1);
  }

  // Favorites
  static List<String> getFavorites() {
    final list = _favoritesBox.get('ids', defaultValue: <dynamic>[]);
    return List<String>.from(list);
  }
  static Future<void> toggleFavorite(String id) async {
    final list = getFavorites();
    if (list.contains(id)) {
      list.remove(id);
    } else {
      list.add(id);
    }
    await _favoritesBox.put('ids', list);
  }
  static bool isFavorite(String id) => getFavorites().contains(id);

  // Tracker Progress
  static List<String> getCompletedAdhkarCategories() {
    final today = _getTodayKey();
    final list = _trackerBox.get('completed_categories_$today', defaultValue: <dynamic>[]);
    return List<String>.from(list);
  }

  static Future<void> toggleCategoryCompleted(String categoryId) async {
    final today = _getTodayKey();
    final list = getCompletedAdhkarCategories();
    if (list.contains(categoryId)) {
      list.remove(categoryId);
    } else {
      list.add(categoryId);
    }
    await _trackerBox.put('completed_categories_$today', list);
  }

  // Tasbih Count History
  static int getCompletedTasbihCount() {
    final today = _getTodayKey();
    return _trackerBox.get('tasbih_completed_$today', defaultValue: 0);
  }

  static Future<void> addCompletedTasbih(int count) async {
    final today = _getTodayKey();
    final current = getCompletedTasbihCount();
    await _trackerBox.put('tasbih_completed_$today', current + count);
  }

  // Daily Worship checklist tracking
  static Map<String, dynamic> getDailyProgress(String dateKey) {
    return {
      'salawat': _trackerBox.get('salawat_$dateKey', defaultValue: 0),
      'completed_categories': List<String>.from(_trackerBox.get('completed_categories_$dateKey', defaultValue: <dynamic>[])),
      'tasbih_completed': _trackerBox.get('tasbih_completed_$dateKey', defaultValue: 0),
    };
  }

  // Get last 7 days keys
  static List<String> getLast7DaysKeys() {
    final List<String> keys = [];
    for (int i = 6; i >= 0; i--) {
      final date = DateTime.now().subtract(Duration(days: i));
      keys.add("${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}");
    }
    return keys;
  }

  static String _getTodayKey() {
    final now = DateTime.now();
    return "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
  }
}
