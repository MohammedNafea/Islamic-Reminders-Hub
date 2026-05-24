import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../core/localization/hijri_helper.dart';
import '../core/theme/app_theme.dart';
import '../providers/tracker_provider.dart';
import '../providers/settings_provider.dart';
import '../data/quran_data.dart';
import '../models/verse.dart';

class HomeScreen extends StatelessWidget {
  final Function(String)? onCategorySelect;

  const HomeScreen({super.key, this.onCategorySelect});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final tracker = Provider.of<TrackerProvider>(context);
    
    final now = DateTime.now();
    final hour = now.hour;
    final isArabic = settings.languageCode == 'ar';
    
    String greetingKey = 'home_greeting_morning';
    IconData greetingIcon = Icons.wb_sunny_outlined;
    Color greetingColor = Colors.orange;
    
    if (hour >= 12 && hour < 18) {
      greetingKey = 'home_greeting_evening';
      greetingIcon = Icons.wb_twilight;
      greetingColor = Colors.amber.shade700;
    } else if (hour >= 18 || hour < 4) {
      greetingKey = 'home_greeting_night';
      greetingIcon = Icons.nightlight_round;
      greetingColor = Colors.indigo;
    }

    final hijriStr = HijriHelper.getHijriDate(now, settings.languageCode);
    final gregorianStr = isArabic
        ? "${now.day} ${_getArabicMonthName(now.month)} ${now.year} م"
        : "${_getEnglishMonthName(now.month)} ${now.day}, ${now.year}";

    final verse = getVerseOfTheDay();

    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header with Greeting & Date
              _buildHeader(context, localizations.translate(greetingKey), greetingIcon, greetingColor, hijriStr, gregorianStr),
              const SizedBox(height: 20),

              // 2. Interactive Salawat counter
              _buildSalawatCard(context, tracker, localizations, settings.fontSizeScale),
              const SizedBox(height: 24),

              // 3. Verse of the Hour
              _buildVerseCard(context, verse, localizations, settings.fontSizeScale),
              const SizedBox(height: 24),

              // 4. Quick Access Categories
              Text(
                localizations.translate('nav_adhkar'),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _buildQuickAccessGrid(context, localizations),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    String greeting,
    IconData icon,
    Color iconColor,
    String hijriDate,
    String gregorianDate,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.02),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: iconColor, size: 24),
                    const SizedBox(width: 8),
                    Text(
                      greeting,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  hijriDate,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  gregorianDate,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                      ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.mosque,
              size: 40,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSalawatCard(
    BuildContext context,
    TrackerProvider tracker,
    AppLocalizations localizations,
    double scale,
  ) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.secondary.withValues(alpha: 0.15),
              Theme.of(context).colorScheme.surface,
            ],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              localizations.translate('home_salawat_banner'),
              style: AppTheme.getArabicTextStyle(
                fontSize: 22 * scale,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              localizations.translate('home_salawat_subtitle'),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Column(
                  children: [
                    Text(
                      '${tracker.salawatCount}',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      localizations.translate('home_salawat_today'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(width: 40),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    tracker.incrementSalawat();
                  },
                  child: Container(
                    height: 72,
                    width: 72,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerseCard(
    BuildContext context,
    Verse verse,
    AppLocalizations localizations,
    double scale,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.menu_book,
                  color: Theme.of(context).colorScheme.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  localizations.translate('home_verse_of_hour'),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            Center(
              child: Text(
                verse.text,
                style: AppTheme.getArabicTextStyle(
                  fontSize: 22 * scale,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            if (localizations.locale.languageCode != 'ar') ...[
              const SizedBox(height: 12),
              Text(
                verse.translation,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "﴿${verse.sura}: ${verse.verseNumber}﴾",
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAccessGrid(BuildContext context, AppLocalizations localizations) {
    final categories = [
      {
        'id': 'morning',
        'titleAr': 'أذكار الصباح',
        'titleEn': 'Morning Adhkar',
        'titleAm': 'የጠዋት አዝካር',
        'descKey': 'home_morning_desc',
        'icon': Icons.wb_sunny,
        'color': Colors.orange,
      },
      {
        'id': 'evening',
        'titleAr': 'أذكار المساء',
        'titleEn': 'Evening Adhkar',
        'titleAm': 'የምሽት አዝካር',
        'descKey': 'home_evening_desc',
        'icon': Icons.brightness_3,
        'color': Colors.indigo,
      },
      {
        'id': 'morning_ruqyah',
        'titleAr': 'الصباح والرقية',
        'titleEn': 'Morning + Ruqyah',
        'titleAm': 'የጠዋት + ሩቅያህ',
        'descKey': 'home_morning_ruqyah_desc',
        'icon': Icons.wb_sunny_outlined,
        'color': Colors.deepOrange,
      },
      {
        'id': 'evening_ruqyah',
        'titleAr': 'المساء والرقية',
        'titleEn': 'Evening + Ruqyah',
        'titleAm': 'የምሽት + ሩቅያህ',
        'descKey': 'home_evening_ruqyah_desc',
        'icon': Icons.nightlight_round,
        'color': Colors.deepPurple,
      },
      {
        'id': 'sleep',
        'titleAr': 'أذكار النوم',
        'titleEn': 'Sleep Adhkar',
        'titleAm': 'የእንቅልፍ አዝካር',
        'descKey': 'home_sleep_desc',
        'icon': Icons.bedtime,
        'color': Colors.purple,
      },
      {
        'id': 'prayer',
        'titleAr': 'أذكار بعد الصلاة',
        'titleEn': 'Post-Prayer Adhkar',
        'titleAm': 'ከሶላት በኋላ አዝካር',
        'descKey': 'home_prayer_desc',
        'icon': Icons.volunteer_activism,
        'color': Colors.teal,
      },
    ];

    final isWide = MediaQuery.of(context).size.width >= 600;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: categories.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isWide ? 4 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: isWide ? 1.3 : 1.15,
      ),
      itemBuilder: (context, index) {
        final cat = categories[index];
        final id = cat['id'] as String;
        final icon = cat['icon'] as IconData;
        final color = cat['color'] as Color;
        final desc = localizations.translate(cat['descKey'] as String);
        
        String title = cat['titleAr'] as String;
        if (localizations.locale.languageCode == 'en') {
          title = cat['titleEn'] as String;
        } else if (localizations.locale.languageCode == 'am') {
          title = cat['titleAm'] as String;
        }

        return InkWell(
          onTap: () {
            if (onCategorySelect != null) {
              onCategorySelect!(id);
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icon,
                      color: color,
                      size: 24,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 10,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _getArabicMonthName(int month) {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1];
  }

  String _getEnglishMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }
}
