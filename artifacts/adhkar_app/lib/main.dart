import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'core/storage/app_storage.dart';
import 'core/theme/app_theme.dart';
import 'core/localization/app_localizations.dart';
import 'providers/settings_provider.dart';
import 'providers/tracker_provider.dart';
import 'providers/audio_player_provider.dart';
import 'screens/main_layout.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize local storage (Hive)
  await AppStorage.init();

  // Request essential permissions for notifications and location
  await _requestInitialPermissions();

  runApp(const MyApp());
}

/// Request notification and location permissions at startup
Future<void> _requestInitialPermissions() async {
  try {
    // Request notification permission (for prayer time alerts and adhkar reminders)
    final notifStatus = await Permission.notification.status;
    if (notifStatus.isDenied) {
      await Permission.notification.request();
    }

    // Request location permission (for prayer times and Qibla direction)
    final locationStatus = await Permission.locationWhenInUse.status;
    if (locationStatus.isDenied) {
      await Permission.locationWhenInUse.request();
    }

    // Request exact alarm permission (for Android 12+ prayer/adhkar schedule)
    final alarmStatus = await Permission.scheduleExactAlarm.status;
    if (alarmStatus.isDenied) {
      await Permission.scheduleExactAlarm.request();
    }
  } catch (_) {
    // Silently handle if permissions are not available on this platform
  }
}


class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => TrackerProvider()),
        ChangeNotifierProvider(create: (_) => AudioPlayerProvider()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp(
            title: 'Islamic Reminders Hub',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.getTheme(settings.themeMode),
            locale: settings.locale,
            localizationsDelegates: const [
              AppLocalizationsDelegate(),
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: AppLocalizations.supportedLanguages.map(
              (lang) => Locale(lang.code, ''),
            ).toList(),
            localeResolutionCallback: (locale, supportedLocales) {
              for (var supportedLocale in supportedLocales) {
                if (supportedLocale.languageCode == locale?.languageCode) {
                  return supportedLocale;
                }
              }
              return supportedLocales.first;
            },
            home: const MainLayout(),
          );
        },
      ),
    );
  }
}
