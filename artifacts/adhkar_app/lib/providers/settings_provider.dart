import 'package:flutter/material.dart';
import '../core/storage/app_storage.dart';
import '../core/theme/app_theme.dart';

class SettingsProvider extends ChangeNotifier {
  late String _languageCode;
  late AppThemeMode _themeMode;
  late double _fontSizeScale;

  String get languageCode => _languageCode;
  AppThemeMode get themeMode => _themeMode;
  double get fontSizeScale => _fontSizeScale;

  SettingsProvider() {
    _languageCode = AppStorage.getLanguage();
    _fontSizeScale = AppStorage.getFontSizeScale();
    
    final themeStr = AppStorage.getThemeMode();
    _themeMode = AppThemeMode.values.firstWhere(
      (e) => e.name == themeStr,
      orElse: () => AppThemeMode.light,
    );
  }

  Locale get locale => Locale(_languageCode);

  Future<void> setLanguage(String code) async {
    _languageCode = code;
    await AppStorage.setLanguage(code);
    notifyListeners();
  }

  Future<void> setThemeMode(AppThemeMode mode) async {
    _themeMode = mode;
    await AppStorage.setThemeMode(mode.name);
    notifyListeners();
  }

  Future<void> setFontSizeScale(double scale) async {
    _fontSizeScale = scale;
    await AppStorage.setFontSizeScale(scale);
    notifyListeners();
  }
}
