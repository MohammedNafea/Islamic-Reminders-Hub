import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum AppThemeMode { light, dark, fajr, duha, maghrib, sahar }

class AppTheme {
  static ColorScheme getColorScheme(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFF1A4731), // hsl(151, 46%, 19%)
          onPrimary: Colors.white,
          secondary: Color(0xFFC9A84C), // hsl(44, 54%, 54%)
          onSecondary: Colors.white,
          error: Color(0xFFD32F2F),
          onError: Colors.white,
          surface: Colors.white, // card
          onSurface: Color(0xFF0F261B), // hsl(151, 46%, 10%)
          surfaceContainerHighest: Color(0xFFEFECE0), // muted hsl(50, 20%, 90%)
          onSurfaceVariant: Color(0xFF284C3A), // muted-foreground hsl(151, 30%, 22%)
          outline: Color(0xFFCCC5A8), // border hsl(50, 20%, 80%)
        );
      case AppThemeMode.dark:
        return const ColorScheme(
          brightness: Brightness.dark,
          primary: Color(0xFFD4B15C), // hsl(44, 60%, 60%)
          onPrimary: Color(0xFF070D0A), // hsl(148, 28%, 6%)
          secondary: Color(0xFF1A4731), // hsl(151, 46%, 19%)
          onSecondary: Colors.white,
          error: Color(0xFF8B1E1E),
          onError: Colors.white,
          surface: Color(0xFF09140E), // card hsl(151, 30%, 8%)
          onSurface: Color(0xFFFAF9F5), // hsl(52, 40%, 95%)
          surfaceContainerHighest: Color(0xFF16251E), // muted hsl(151, 30%, 15%)
          onSurfaceVariant: Color(0xFFCCC7B8), // muted-foreground hsl(50, 20%, 80%)
          outline: Color(0xFF243B2F), // border hsl(151, 25%, 20%)
        );
      case AppThemeMode.fajr: // Lavender Spiritual
        return const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFF5A3D80), // Lavender
          onPrimary: Colors.white,
          secondary: Color(0xFFD97C3A), // Soft Orange
          onSecondary: Colors.white,
          error: Color(0xFFD32F2F),
          onError: Colors.white,
          surface: Color(0xFFF9F6FA),
          onSurface: Color(0xFF181026),
          surfaceContainerHighest: Color(0xFFF0EBF5),
          onSurfaceVariant: Color(0xFF483D59),
          outline: Color(0xFFD9CFE6),
        );
      case AppThemeMode.duha: // Sky Blue
        return const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFF3388A6), // Sky Blue
          onPrimary: Colors.white,
          secondary: Color(0xFFD9A036), // Sun Gold
          onSecondary: Colors.white,
          error: Color(0xFFD32F2F),
          onError: Colors.white,
          surface: Color(0xFFF6FAF9),
          onSurface: Color(0xFF0A2026),
          surfaceContainerHighest: Color(0xFFEBF3F5),
          onSurfaceVariant: Color(0xFF384F59),
          outline: Color(0xFFCFDEE6),
        );
      case AppThemeMode.maghrib: // Sunset Orange
        return const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFFC04E30), // Sunset Orange
          onPrimary: Colors.white,
          secondary: Color(0xFF2A6040), // Dusk Green
          onSecondary: Colors.white,
          error: Color(0xFFD32F2F),
          onError: Colors.white,
          surface: Color(0xFFFAF7F6),
          onSurface: Color(0xFF26100A),
          surfaceContainerHighest: Color(0xFFF5EBE8),
          onSurfaceVariant: Color(0xFF593F38),
          outline: Color(0xFFE6D2CD),
        );
      case AppThemeMode.sahar: // Night Blue
        return const ColorScheme(
          brightness: Brightness.dark,
          primary: Color(0xFF6A8AD9), // Night Blue
          onPrimary: Color(0xFF03050C),
          secondary: Color(0xFF8C7CD9), // Indigo
          onSecondary: Colors.white,
          error: Color(0xFF8B1E1E),
          onError: Colors.white,
          surface: Color(0xFF090D1A),
          onSurface: Color(0xFFF0F2FA),
          surfaceContainerHighest: Color(0xFF151B2E),
          onSurfaceVariant: Color(0xFFBDC2D9),
          outline: Color(0xFF2E3859),
        );
    }
  }

  static Color getBackgroundColor(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return const Color(0xFFFDFCF5);
      case AppThemeMode.dark:
        return const Color(0xFF0A120E);
      case AppThemeMode.fajr:
        return const Color(0xFFFAF9FC);
      case AppThemeMode.duha:
        return const Color(0xFFF5F9FA);
      case AppThemeMode.maghrib:
        return const Color(0xFFFAF8F5);
      case AppThemeMode.sahar:
        return const Color(0xFF03050A);
    }
  }

  static ThemeData getTheme(AppThemeMode mode) {
    final colorScheme = getColorScheme(mode);
    final backgroundColor = getBackgroundColor(mode);

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: backgroundColor,
      cardColor: colorScheme.surface,
      dividerColor: colorScheme.outline.withValues(alpha: 0.5),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.bold,
        ),
        displayMedium: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.bold,
        ),
        displaySmall: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.bold,
        ),
        headlineLarge: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
        headlineSmall: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
        titleLarge: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.bold,
        ),
        titleMedium: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
        titleSmall: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w500,
        ),
        bodyLarge: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurface,
        ),
        bodyMedium: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurfaceVariant,
        ),
        bodySmall: GoogleFonts.notoSansArabic(
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: backgroundColor,
        elevation: 0,
        iconTheme: IconThemeData(color: colorScheme.onSurface),
        titleTextStyle: GoogleFonts.cinzel(
          color: colorScheme.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: colorScheme.outline.withValues(alpha: 0.5), width: 1),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: elevatedButtonStyleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
    );
  }

  // Sacred text style for Quran & Dhikr Arabic texts
  static TextStyle getArabicTextStyle({
    required double fontSize,
    required Color color,
  }) {
    return GoogleFonts.amiri(
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w600,
      height: 1.8,
    );
  }

  static ButtonStyle elevatedButtonStyleFrom({
    required Color backgroundColor,
    required Color foregroundColor,
    required OutlinedBorder shape,
    required EdgeInsetsGeometry padding,
  }) {
    return ElevatedButton.styleFrom(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      shape: shape,
      padding: padding,
      elevation: 0,
    );
  }
}
