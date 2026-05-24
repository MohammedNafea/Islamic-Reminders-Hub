import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../core/theme/app_theme.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          localizations.translate('settings_title'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader(context, localizations.translate('settings_language')),
            const SizedBox(height: 8),
            _buildLanguageCard(context, settings, localizations),
            const SizedBox(height: 24),
            _buildSectionHeader(context, localizations.translate('settings_theme')),
            const SizedBox(height: 8),
            _buildThemeGrid(context, settings, localizations),
            const SizedBox(height: 24),
            _buildSectionHeader(context, localizations.translate('settings_font_size')),
            const SizedBox(height: 8),
            _buildFontSizeCard(context, settings, localizations),
            const SizedBox(height: 40),
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.mosque,
                    size: 48,
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    localizations.translate('app_name'),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Version 1.0.0',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  Widget _buildLanguageCard(
    BuildContext context,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    final languages = [
      {'code': 'ar', 'name': 'العربية'},
      {'code': 'en', 'name': 'English'},
      {'code': 'am', 'name': 'አማርኛ'},
    ];

    return Card(
      child: Column(
        children: languages.map((lang) {
          final isSelected = settings.languageCode == lang['code'];
          return Column(
            children: [
              ListTile(
                title: Text(
                  lang['name']!,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                trailing: isSelected
                    ? Icon(Icons.check_circle, color: Theme.of(context).colorScheme.primary)
                    : const Icon(Icons.circle_outlined),
                onTap: () {
                  settings.setLanguage(lang['code']!);
                },
              ),
              if (lang != languages.last)
                Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildThemeGrid(
    BuildContext context,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    final themes = [
      {
        'mode': AppThemeMode.light,
        'label': localizations.translate('settings_light'),
        'icon': Icons.light_mode,
        'color': const Color(0xFF1A4731),
      },
      {
        'mode': AppThemeMode.dark,
        'label': localizations.translate('settings_dark'),
        'icon': Icons.dark_mode,
        'color': const Color(0xFFD4B15C),
      },
      {
        'mode': AppThemeMode.fajr,
        'label': localizations.translate('settings_theme_fajr'),
        'icon': Icons.brightness_2,
        'color': const Color(0xFF5A3D80),
      },
      {
        'mode': AppThemeMode.duha,
        'label': localizations.translate('settings_theme_duha'),
        'icon': Icons.wb_sunny,
        'color': const Color(0xFF3388A6),
      },
      {
        'mode': AppThemeMode.maghrib,
        'label': localizations.translate('settings_theme_maghrib'),
        'icon': Icons.wb_twilight,
        'color': const Color(0xFFC04E30),
      },
      {
        'mode': AppThemeMode.sahar,
        'label': localizations.translate('settings_theme_sahar'),
        'icon': Icons.nightlight_round,
        'color': const Color(0xFF6A8AD9),
      },
    ];

    final isWide = MediaQuery.of(context).size.width >= 600;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isWide ? 3 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: isWide ? 2.5 : 2.0,
      ),
      itemCount: themes.length,
      itemBuilder: (context, index) {
        final theme = themes[index];
        final isSelected = settings.themeMode == theme['mode'];
        final color = theme['color'] as Color;

        return InkWell(
          onTap: () {
            settings.setThemeMode(theme['mode'] as AppThemeMode);
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected
                  ? color.withValues(alpha: 0.12)
                  : Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected
                    ? color
                    : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                width: isSelected ? 2 : 1,
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    theme['icon'] as IconData,
                    color: color,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    theme['label'] as String,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected
                          ? color
                          : Theme.of(context).colorScheme.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFontSizeCard(
    BuildContext context,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    final sizes = [
      {'scale': 0.85, 'label': localizations.translate('settings_font_sm')},
      {'scale': 1.0, 'label': localizations.translate('settings_font_md')},
      {'scale': 1.2, 'label': localizations.translate('settings_font_lg')},
      {'scale': 1.35, 'label': localizations.translate('settings_font_xl')},
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: sizes.map((size) {
                final isSelected = settings.fontSizeScale == size['scale'];
                return InkWell(
                  onTap: () {
                    settings.setFontSizeScale(size['scale'] as double);
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary
                            : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      size['label'] as String,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Text(
              'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
              style: AppTheme.getArabicTextStyle(
                fontSize: 20 * settings.fontSizeScale,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
