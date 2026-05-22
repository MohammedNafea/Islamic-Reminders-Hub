import 'package:flutter/material.dart';
import '../core/storage/app_storage.dart';

class TrackerProvider extends ChangeNotifier {
  late int _salawatCount;
  late List<String> _favorites;
  late List<String> _completedCategories;
  late int _tasbihCompletedCount;

  int get salawatCount => _salawatCount;
  List<String> get favorites => _favorites;
  List<String> get completedCategories => _completedCategories;
  int get tasbihCompletedCount => _tasbihCompletedCount;

  TrackerProvider() {
    _loadData();
  }

  void _loadData() {
    _salawatCount = AppStorage.getSalawatCount();
    _favorites = AppStorage.getFavorites();
    _completedCategories = AppStorage.getCompletedAdhkarCategories();
    _tasbihCompletedCount = AppStorage.getCompletedTasbihCount();
  }

  Future<void> incrementSalawat() async {
    await AppStorage.incrementSalawat();
    _salawatCount = AppStorage.getSalawatCount();
    notifyListeners();
  }

  Future<void> toggleFavorite(String id) async {
    await AppStorage.toggleFavorite(id);
    _favorites = AppStorage.getFavorites();
    notifyListeners();
  }

  bool isFavorite(String id) {
    return _favorites.contains(id);
  }

  Future<void> toggleCategoryCompleted(String categoryId) async {
    await AppStorage.toggleCategoryCompleted(categoryId);
    _completedCategories = AppStorage.getCompletedAdhkarCategories();
    notifyListeners();
  }

  bool isCategoryCompleted(String categoryId) {
    return _completedCategories.contains(categoryId);
  }

  Future<void> addCompletedTasbih(int count) async {
    await AppStorage.addCompletedTasbih(count);
    _tasbihCompletedCount = AppStorage.getCompletedTasbihCount();
    notifyListeners();
  }

  // Reload data (e.g. when day changes)
  void refresh() {
    _loadData();
    notifyListeners();
  }

  // Get weekly dashboard statistics
  List<Map<String, dynamic>> getWeeklyStats() {
    final keys = AppStorage.getLast7DaysKeys();
    return keys.map((key) {
      final progress = AppStorage.getDailyProgress(key);
      // Clean up the key to show Day Name or date
      final date = DateTime.parse(key);
      final weekdaysAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
      final weekdaysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      return {
        'date': key,
        'dayLabelAr': weekdaysAr[date.weekday - 1],
        'dayLabelEn': weekdaysEn[date.weekday - 1],
        'salawat': progress['salawat'] as int,
        'tasbih': progress['tasbih_completed'] as int,
        'categoriesCount': (progress['completed_categories'] as List).length,
      };
    }).toList();
  }
}
