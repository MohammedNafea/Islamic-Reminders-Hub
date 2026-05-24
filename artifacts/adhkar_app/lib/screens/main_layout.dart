import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../providers/settings_provider.dart';
import 'home_screen.dart';
import 'adhkar_screen.dart';
import 'tasbih_screen.dart';
import 'quran_screen.dart';
import 'zakat_screen.dart';
import 'prayer_screen.dart';
import 'tracker_screen.dart';
import 'settings_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  String? _adhkarInitialCategory;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final isArabic = settings.languageCode == 'ar';
    final isWide = MediaQuery.of(context).size.width >= 900;

    final screens = [
      HomeScreen(
        onCategorySelect: (category) {
          setState(() {
            _adhkarInitialCategory = category;
            _currentIndex = 1;
          });
        },
      ),
      AdhkarScreen(
        initialCategory: _adhkarInitialCategory,
        onClearInitialCategory: () {
          _adhkarInitialCategory = null;
        },
      ),
      const TasbihScreen(),
      const QuranScreen(),
      const ZakatScreen(),
      const PrayerScreen(),
      const TrackerScreen(),
      const SettingsScreen(),
    ];

    final navigationItems = [
      _NavItem(icon: Icons.home, labelKey: 'nav_home'),
      _NavItem(icon: Icons.brightness_3, labelKey: 'nav_adhkar'),
      _NavItem(icon: Icons.radar, labelKey: 'nav_tasbih'),
      _NavItem(icon: Icons.menu_book, labelKey: 'nav_quran'),
      _NavItem(icon: Icons.calculate, labelKey: 'nav_zakat'),
      _NavItem(icon: Icons.access_time, labelKey: 'nav_prayer'),
      _NavItem(icon: Icons.analytics, labelKey: 'nav_tracker'),
      _NavItem(icon: Icons.settings, labelKey: 'nav_settings'),
    ];

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            // Sidebar Navigation for Desktop/Web
            Container(
              width: 250,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  right: isArabic
                      ? BorderSide.none
                      : BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                  left: isArabic
                      ? BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5))
                      : BorderSide.none,
                ),
              ),
              child: Column(
                children: [
                  // App logo/header
                  Container(
                    padding: const EdgeInsets.all(24),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        Icon(
                          Icons.mosque,
                          size: 48,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          localizations.translate('app_name'),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                        ),
                        Text(
                          localizations.translate('app_tagline'),
                          style: Theme.of(context).textTheme.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: ListView.builder(
                      itemCount: navigationItems.length,
                      itemBuilder: (context, index) {
                        final item = navigationItems[index];
                        final isSelected = _currentIndex == index;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _currentIndex = index;
                              });
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    item.icon,
                                    color: isSelected
                                        ? Theme.of(context).colorScheme.primary
                                        : Theme.of(context).colorScheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 16),
                                  Text(
                                    localizations.translate(item.labelKey),
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          color: isSelected
                                              ? Theme.of(context).colorScheme.primary
                                              : Theme.of(context).colorScheme.onSurface,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            // Screen Content
            Expanded(
              child: screens[_currentIndex],
            ),
          ],
        ),
      );
    } else {
      // Bottom Navigation for Mobile
      return Scaffold(
        body: SafeArea(
          child: screens[_currentIndex],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3), width: 1),
            ),
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            type: BottomNavigationBarType.fixed,
            backgroundColor: Theme.of(context).colorScheme.surface,
            selectedItemColor: Theme.of(context).colorScheme.primary,
            unselectedItemColor: Theme.of(context).colorScheme.onSurfaceVariant,
            selectedLabelStyle: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10, fontWeight: FontWeight.bold),
            unselectedLabelStyle: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
            items: navigationItems.map((item) {
              return BottomNavigationBarItem(
                icon: Icon(item.icon),
                label: localizations.translate(item.labelKey),
              );
            }).toList(),
          ),
        ),
      );
    }
  }
}

class _NavItem {
  final IconData icon;
  final String labelKey;

  const _NavItem({required this.icon, required this.labelKey});
}
