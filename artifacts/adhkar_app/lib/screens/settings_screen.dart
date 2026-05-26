import 'dart:convert';
import 'package:http/http.dart' as http;
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
            _buildSectionHeader(context, settings.languageCode == 'ar' ? 'الموقع الجغرافي' : 'Location Settings'),
            const SizedBox(height: 8),
            _buildLocationCard(context, settings),
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
    final currentLang = AppLocalizations.supportedLanguages.firstWhere(
      (l) => l.code == settings.languageCode,
      orElse: () => AppLocalizations.supportedLanguages.first,
    );

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.15),
        ),
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: Text(
          currentLang.flag,
          style: const TextStyle(fontSize: 24),
        ),
        title: Text(
          localizations.translate('settings_language'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          currentLang.nativeName,
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          _showLanguageSelectorBottomSheet(context, settings, localizations);
        },
      ),
    );
  }

  void _showLanguageSelectorBottomSheet(
    BuildContext context,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return _LanguageSelectorWidget(
          settings: settings,
          localizations: localizations,
        );
      },
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

  Widget _buildLocationCard(BuildContext context, SettingsProvider settings) {
    final isArabic = settings.languageCode == 'ar';
    final hasOverride = settings.latOverride != null;
    final city = settings.cityOverride ?? (isArabic ? 'مكة المكرمة' : 'Makkah');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.location_on, color: Theme.of(context).colorScheme.primary),
              title: Text(
                hasOverride ? city : (isArabic ? 'تحديد تلقائي (GPS)' : 'Auto Detect (GPS)'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                hasOverride 
                  ? (isArabic ? 'موقع مخصص (مواقيت صلاة مخصصة)' : 'Manual override active')
                  : (isArabic ? 'يتم تحديد الموقع تلقائياً عبر نظام تحديد المواقع' : 'Location is automatically determined via GPS'),
                style: const TextStyle(fontSize: 11),
              ),
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      await settings.clearLocationOverride();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(isArabic 
                            ? 'تم تفعيل التحديد التلقائي عبر GPS' 
                            : 'Auto GPS detection enabled'),
                        ));
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: !hasOverride ? Theme.of(context).colorScheme.primary : Colors.transparent,
                      foregroundColor: !hasOverride ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.primary,
                      side: BorderSide(color: Theme.of(context).colorScheme.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isArabic ? 'تلقائي' : 'GPS Auto'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      _showLocationInputModal(context, settings, isArabic);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasOverride ? Theme.of(context).colorScheme.primary : Colors.transparent,
                      foregroundColor: hasOverride ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.primary,
                      side: BorderSide(color: Theme.of(context).colorScheme.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isArabic ? 'تعديل يدوي' : 'Manual'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showLocationInputModal(BuildContext context, SettingsProvider settings, bool isArabic) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            isArabic ? 'إدخال المدينة يدوياً' : 'Manual City Input',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(
              labelText: isArabic ? 'اسم المدينة' : 'City Name',
              hintText: isArabic ? 'مثال: القاهرة، مكة...' : 'e.g. Cairo, Mecca...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(isArabic ? 'إلغاء' : 'Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final city = controller.text.trim();
                if (city.isNotEmpty) {
                  Navigator.pop(dialogContext);
                  // Call Nominatim to search coordinates
                  try {
                    final response = await http.get(Uri.parse(
                      "https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(city)}&format=json&limit=1"
                    ));
                    if (response.statusCode == 200) {
                      final List data = json.decode(response.body);
                      if (data.isNotEmpty) {
                        final lat = double.parse(data[0]['lat']);
                        final lng = double.parse(data[0]['lon']);
                        final displayName = data[0]['display_name'] as String;
                        final shortName = displayName.split(',')[0];
                        await settings.setLocationOverride(lat, lng, shortName);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(isArabic 
                              ? 'تم تحديث الموقع لـ $shortName بنجاح!' 
                              : 'Location set to $shortName successfully!'),
                          ));
                        }
                      } else {
                        if (context.mounted) {
                          _showError(context, isArabic ? 'لم يتم العثور على المدينة' : 'City not found');
                        }
                      }
                    }
                  } catch (e) {
                    if (context.mounted) {
                      _showError(context, isArabic ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
                    }
                  }
                }
              },
              child: Text(isArabic ? 'بحث وتعيين' : 'Search & Set'),
            ),
          ],
        );
      },
    );
  }

  void _showError(BuildContext context, String msg) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Icon(Icons.error_outline, color: Colors.red),
        content: Text(msg),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }
}

class _LanguageSelectorWidget extends StatefulWidget {
  final SettingsProvider settings;
  final AppLocalizations localizations;

  const _LanguageSelectorWidget({
    required this.settings,
    required this.localizations,
  });

  @override
  State<_LanguageSelectorWidget> createState() => _LanguageSelectorWidgetState();
}

class _LanguageSelectorWidgetState extends State<_LanguageSelectorWidget> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final searchPlaceholder = widget.localizations.locale.languageCode == 'ar' ? 'بحث عن لغة...' : 'Search language...';
    final title = widget.localizations.translate('settings_language');

    final filteredLangs = AppLocalizations.supportedLanguages.where((lang) {
      final query = _searchQuery.toLowerCase();
      return lang.name.toLowerCase().contains(query) ||
             lang.nativeName.toLowerCase().contains(query) ||
             lang.code.toLowerCase().contains(query);
    }).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: EdgeInsets.only(
        top: 16,
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              hintText: searchPlaceholder,
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: filteredLangs.length,
              itemBuilder: (context, index) {
                final lang = filteredLangs[index];
                final isSelected = widget.settings.languageCode == lang.code;
                return Column(
                  children: [
                    ListTile(
                      leading: Text(
                        lang.flag,
                        style: const TextStyle(fontSize: 24),
                      ),
                      title: Text(
                        lang.nativeName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(lang.name),
                      trailing: isSelected
                          ? Icon(Icons.check_circle, color: Theme.of(context).colorScheme.primary)
                          : const Icon(Icons.circle_outlined),
                      onTap: () {
                        widget.settings.setLanguage(lang.code);
                        Navigator.pop(context);
                      },
                    ),
                    Divider(
                      height: 1,
                      indent: 16,
                      endIndent: 16,
                      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.1),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
