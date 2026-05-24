import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../core/theme/app_theme.dart';
import '../providers/settings_provider.dart';
import '../providers/tracker_provider.dart';
import '../data/adhkar_data.dart';
import '../models/dhikr.dart';

class AdhkarScreen extends StatefulWidget {
  final String? initialCategory;
  final VoidCallback? onClearInitialCategory;

  const AdhkarScreen({
    super.key,
    this.initialCategory,
    this.onClearInitialCategory,
  });

  @override
  State<AdhkarScreen> createState() => _AdhkarScreenState();
}

class _AdhkarScreenState extends State<AdhkarScreen> {
  String? _selectedCategory;
  String _searchQuery = '';
  final Map<String, int> _counts = {};
  bool _showFavoritesOnly = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory != null) {
      _selectedCategory = widget.initialCategory;
      if (widget.onClearInitialCategory != null) {
        widget.onClearInitialCategory!();
      }
    }
  }

  @override
  void didUpdateWidget(covariant AdhkarScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategory != null) {
      setState(() {
        _selectedCategory = widget.initialCategory;
        _showFavoritesOnly = false;
      });
      if (widget.onClearInitialCategory != null) {
        widget.onClearInitialCategory!();
      }
    }
  }

  List<Dhikr> _getDhikrList(String category, TrackerProvider tracker) {
    switch (category) {
      case 'morning':
        return [
          ...adhkarMorningEvening,
          ...adhkarMorningOnly,
          ...adhkarMorningVariant,
          ...adhkarDayFull,
        ];
      case 'evening':
        return [
          ...adhkarMorningEvening,
          ...adhkarEveningOnly,
          ...adhkarDayFull,
        ];
      case 'sleep':
        return adhkarSleep;
      case 'prayer':
        return adhkarPrayer;
      case 'ruqyah':
        return adhkarRuqyah;
      case 'salawat':
        return adhkarSalawat;
      case 'house':
        return adhkarHouse;
      case 'masjid':
        return adhkarMasjid;
      case 'favorites':
        final favs = tracker.favorites;
        return allAdhkar.where((d) => favs.contains(d.id)).toList();
      default:
        return [];
    }
  }

  String _getCategoryTitle(String key, AppLocalizations localizations) {
    switch (key) {
      case 'morning':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار الصباح'
            : (localizations.locale.languageCode == 'en' ? 'Morning Adhkar' : 'የጠዋት አዝካር');
      case 'evening':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار المساء'
            : (localizations.locale.languageCode == 'en' ? 'Evening Adhkar' : 'የምሽት አዝካር');
      case 'sleep':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار النوم'
            : (localizations.locale.languageCode == 'en' ? 'Sleep Adhkar' : 'የእንቅልፍ አዝካር');
      case 'prayer':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار بعد الصلاة'
            : (localizations.locale.languageCode == 'en' ? 'Post-Prayer Adhkar' : 'ከሶላት በኋላ አዝካር');
      case 'ruqyah':
        return localizations.locale.languageCode == 'ar'
            ? 'الرقى الشرعية'
            : (localizations.locale.languageCode == 'en' ? 'Ruqyah' : 'ሩቅያህ');
      case 'salawat':
        return localizations.locale.languageCode == 'ar'
            ? 'الصلوات والأدعية'
            : (localizations.locale.languageCode == 'en' ? 'Salawat & Duas' : 'ሰለዋትና ዱዓዎች');
      case 'house':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار المنزل'
            : (localizations.locale.languageCode == 'en' ? 'House Adhkar' : 'የቤት አዝካር');
      case 'masjid':
        return localizations.locale.languageCode == 'ar'
            ? 'أذكار المسجد'
            : (localizations.locale.languageCode == 'en' ? 'Masjid Adhkar' : 'የመስጊድ አዝካር');
      case 'favorites':
        return localizations.translate('nav_favorites');
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final tracker = Provider.of<TrackerProvider>(context);

    if (_selectedCategory != null) {
      return _buildCategoryDhikrList(context, _selectedCategory!, tracker, settings.fontSizeScale, localizations);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          localizations.translate('nav_adhkar'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Search & Filter header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: localizations.translate('nav_search'),
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(
                    _showFavoritesOnly ? Icons.favorite : Icons.favorite_border,
                    color: _showFavoritesOnly ? Colors.red : Theme.of(context).colorScheme.primary,
                  ),
                  onPressed: () {
                    setState(() {
                      _showFavoritesOnly = !_showFavoritesOnly;
                      if (_showFavoritesOnly) {
                        _selectedCategory = 'favorites';
                      } else {
                        _selectedCategory = null;
                      }
                    });
                  },
                  tooltip: localizations.translate('nav_favorites'),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: _searchQuery.isNotEmpty 
              ? _buildSearchResults(context, tracker, settings.fontSizeScale, localizations)
              : _buildCategoryGrid(context, tracker, localizations),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid(
    BuildContext context,
    TrackerProvider tracker,
    AppLocalizations localizations,
  ) {
    final categories = [
      {'key': 'morning', 'icon': Icons.wb_sunny, 'color': Colors.orange},
      {'key': 'evening', 'icon': Icons.brightness_3, 'color': Colors.indigo},
      {'key': 'sleep', 'icon': Icons.bedtime, 'color': Colors.purple},
      {'key': 'prayer', 'icon': Icons.volunteer_activism, 'color': Colors.teal},
      {'key': 'ruqyah', 'icon': Icons.security, 'color': Colors.red},
      {'key': 'salawat', 'icon': Icons.auto_awesome, 'color': Colors.pink},
      {'key': 'house', 'icon': Icons.home, 'color': Colors.brown},
      {'key': 'masjid', 'icon': Icons.mosque, 'color': Colors.blueGrey},
    ];

    final isWide = MediaQuery.of(context).size.width >= 600;

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: categories.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isWide ? 4 : 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: isWide ? 1.4 : 1.2,
      ),
      itemBuilder: (context, index) {
        final cat = categories[index];
        final key = cat['key'] as String;
        final icon = cat['icon'] as IconData;
        final color = cat['color'] as Color;
        
        final title = _getCategoryTitle(key, localizations);
        final isCompleted = tracker.isCategoryCompleted(key);

        return InkWell(
          onTap: () {
            setState(() {
              _selectedCategory = key;
            });
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isCompleted
                    ? Colors.green.withValues(alpha: 0.5)
                    : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                width: isCompleted ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          icon,
                          color: color,
                          size: 28,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (isCompleted)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSearchResults(
    BuildContext context,
    TrackerProvider tracker,
    double scale,
    AppLocalizations localizations,
  ) {
    final query = _searchQuery.toLowerCase();
    final results = allAdhkar.where((d) {
      final textAr = d.arabic.toLowerCase();
      final textEn = d.english?.toLowerCase() ?? '';
      final note = d.note?.toLowerCase() ?? '';
      final source = d.source.toLowerCase();
      return textAr.contains(query) || textEn.contains(query) || note.contains(query) || source.contains(query);
    }).toList();

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              localizations.locale.languageCode == 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results found',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      itemBuilder: (context, index) {
        final dhikr = results[index];
        return _buildDhikrCard(context, dhikr, tracker, scale, localizations);
      },
    );
  }

  Widget _buildCategoryDhikrList(
    BuildContext context,
    String category,
    TrackerProvider tracker,
    double scale,
    AppLocalizations localizations,
  ) {
    final dhikrs = _getDhikrList(category, tracker);
    final title = _getCategoryTitle(category, localizations);
    final isCompleted = tracker.isCategoryCompleted(category);

    // Compute progress
    int completedCount = 0;
    for (final d in dhikrs) {
      final current = _counts[d.id] ?? 0;
      if (current >= d.count) {
        completedCount++;
      }
    }
    final allDone = dhikrs.isNotEmpty && completedCount == dhikrs.length;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            setState(() {
              _selectedCategory = null;
              _showFavoritesOnly = false;
            });
          },
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                for (final d in dhikrs) {
                  _counts[d.id] = 0;
                }
              });
              HapticFeedback.mediumImpact();
            },
            tooltip: localizations.translate('tasbih_reset'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress bar
          if (dhikrs.isNotEmpty)
            LinearProgressIndicator(
              value: completedCount / dhikrs.length,
              backgroundColor: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
              color: allDone ? Colors.green : Theme.of(context).colorScheme.primary,
              minHeight: 6,
            ),
          Expanded(
            child: dhikrs.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.favorite_border,
                          size: 64,
                          color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          localizations.translate('favorites_empty'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          localizations.translate('favorites_empty_desc'),
                          style: Theme.of(context).textTheme.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: dhikrs.length,
                    itemBuilder: (context, index) {
                      final dhikr = dhikrs[index];
                      return _buildDhikrCard(context, dhikr, tracker, scale, localizations);
                    },
                  ),
          ),
        ],
      ),
      // Float floating complete category card
      bottomSheet: (allDone && category != 'favorites' && !isCompleted)
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          localizations.locale.languageCode == 'ar' ? 'أحسنت! أتممت الورد' : 'Well done! Adhkar Completed',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                        ),
                        Text(
                          localizations.locale.languageCode == 'ar' ? 'اضغط لتسجيل الإنجاز في مسار الالتزام' : 'Tap to log achievement in Worship Tracker',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      tracker.toggleCategoryCompleted(category);
                      HapticFeedback.mediumImpact();
                      // Auto return to categories after short delay
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            localizations.locale.languageCode == 'ar' ? 'تم تسجيل ورد اليوم بنجاح!' : 'Worship logged successfully!',
                          ),
                          backgroundColor: Colors.green,
                        ),
                      );
                      setState(() {
                        _selectedCategory = null;
                      });
                    },
                    icon: const Icon(Icons.done_all),
                    label: Text(localizations.translate('common_done')),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  Widget _buildDhikrCard(
    BuildContext context,
    Dhikr dhikr,
    TrackerProvider tracker,
    double scale,
    AppLocalizations localizations,
  ) {
    final currentCount = _counts[dhikr.id] ?? 0;
    final isDone = currentCount >= dhikr.count;
    final isFav = tracker.isFavorite(dhikr.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: isDone 
          ? Colors.green.withValues(alpha: 0.04) 
          : Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        side: BorderSide(
          color: isDone 
              ? Colors.green.withValues(alpha: 0.4) 
              : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
          width: isDone ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          if (!isDone) {
            setState(() {
              final next = currentCount + 1;
              _counts[dhikr.id] = next;
              if (next >= dhikr.count) {
                HapticFeedback.heavyImpact();
              } else {
                HapticFeedback.lightImpact();
              }
            });
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar: Favorite & Counter Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: isFav ? Colors.red : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    onPressed: () {
                      tracker.toggleFavorite(dhikr.id);
                      HapticFeedback.selectionClick();
                    },
                  ),
                  // Count indicator (e.g. 1/3)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDone
                          ? Colors.green
                          : Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "$currentCount / ${dhikr.count}",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isDone ? Colors.white : Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Arabic Text
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Text(
                    dhikr.arabic,
                    style: AppTheme.getArabicTextStyle(
                      fontSize: 22 * scale,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // English Translation & Notes
              if (localizations.locale.languageCode != 'ar') ...[
                if (dhikr.english != null && dhikr.english!.isNotEmpty) ...[
                  Text(
                    dhikr.english!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontStyle: FontStyle.italic,
                        ),
                    textAlign: TextAlign.justify,
                  ),
                  const SizedBox(height: 8),
                ],
                if (dhikr.transliteration != null && dhikr.transliteration!.isNotEmpty) ...[
                  Text(
                    dhikr.transliteration!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                    textAlign: TextAlign.justify,
                  ),
                  const SizedBox(height: 8),
                ],
              ],

              if (dhikr.note != null && dhikr.note!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    dhikr.note!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontStyle: FontStyle.italic,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Source
              Text(
                dhikr.source,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 10,
                      color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
