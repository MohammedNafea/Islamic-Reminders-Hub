import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../providers/settings_provider.dart';
import '../providers/tracker_provider.dart';

class TrackerScreen extends StatefulWidget {
  const TrackerScreen({super.key});

  @override
  State<TrackerScreen> createState() => _TrackerScreenState();
}

class _TrackerScreenState extends State<TrackerScreen> {
  int _activeTab = 0; // 0: Salawat, 1: Tasbih, 2: Adhkar Categories

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final tracker = Provider.of<TrackerProvider>(context);
    final isArabic = settings.languageCode == 'ar';

    final weeklyStats = tracker.getWeeklyStats();

    // Calculate totals
    int totalSalawat = 0;
    int totalTasbih = 0;
    int totalAdhkar = 0;
    for (var day in weeklyStats) {
      totalSalawat += day['salawat'] as int;
      totalTasbih += day['tasbih'] as int;
      totalAdhkar += day['categoriesCount'] as int;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          localizations.translate('nav_tracker'),
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
            // 1. Overview cards
            _buildOverviewCards(context, localizations, settings.fontSizeScale, totalSalawat, totalTasbih, totalAdhkar),
            const SizedBox(height: 24),

            // 2. Chart Section
            Text(
              isArabic ? 'رسم بياني أسبوعي' : 'Weekly Analytics',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            _buildChartSection(context, weeklyStats, isArabic),
            const SizedBox(height: 24),

            // 3. Daily detailed log list
            Text(
              isArabic ? 'سجل الالتزام اليومي' : 'Daily Worship Log',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            _buildDailyLogList(context, weeklyStats, isArabic, localizations),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewCards(
    BuildContext context,
    AppLocalizations localizations,
    double scale,
    int salawat,
    int tasbih,
    int adhkar,
  ) {
    final isWide = MediaQuery.of(context).size.width >= 600;
    final isArabic = localizations.locale.languageCode == 'ar';

    final items = [
      {
        'title': isArabic ? 'إجمالي الصلوات' : 'Total Salawat',
        'value': '$salawat',
        'icon': Icons.favorite,
        'color': Colors.red,
        'subtitle': isArabic ? 'هذا الأسبوع' : 'This week',
      },
      {
        'title': isArabic ? 'إجمالي التسبيح' : 'Total Tasbih',
        'value': '$tasbih',
        'icon': Icons.radar,
        'color': Colors.teal,
        'subtitle': isArabic ? 'عدد التكرار' : 'Repetitions',
      },
      {
        'title': isArabic ? 'الأوراد المكتملة' : 'Completed Adhkar',
        'value': '$adhkar',
        'icon': Icons.done_all,
        'color': Colors.green,
        'subtitle': isArabic ? 'تصنيفاً مكتملاً' : 'Completed categories',
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isWide ? 3 : 1,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: isWide ? 2.5 : 3.5,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final color = item['color'] as Color;
        return Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    item['icon'] as IconData,
                    color: color,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] as String,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                            ),
                      ),
                      Text(
                        item['value'] as String,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                      ),
                      Text(
                        item['subtitle'] as String,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              fontSize: 9,
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
      },
    );
  }

  Widget _buildChartSection(BuildContext context, List<Map<String, dynamic>> stats, bool isArabic) {
    // Tab selector (Salawat, Tasbih, Adhkar)
    final tabs = [
      isArabic ? 'الصلوات على النبي' : 'Salawat',
      isArabic ? 'التسبيح والذكر' : 'Tasbih',
      isArabic ? 'الأوراد المكتملة' : 'Adhkar',
    ];

    // Find max value for scaling the bars
    int maxVal = 1;
    for (var day in stats) {
      int val = 0;
      if (_activeTab == 0) val = day['salawat'] as int;
      if (_activeTab == 1) val = day['tasbih'] as int;
      if (_activeTab == 2) val = day['categoriesCount'] as int;
      if (val > maxVal) maxVal = val;
    }

    // Colors
    final activeColor = _activeTab == 0
        ? Colors.red
        : (_activeTab == 1 ? Colors.teal : Colors.green);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Tabs
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: List.generate(tabs.length, (idx) {
                  final isSelected = _activeTab == idx;
                  return Expanded(
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _activeTab = idx;
                        });
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected ? Theme.of(context).colorScheme.surface : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Text(
                          tabs[idx],
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 24),

            // Bar Chart
            SizedBox(
              height: 200,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: stats.map((day) {
                  int val = 0;
                  if (_activeTab == 0) val = day['salawat'] as int;
                  if (_activeTab == 1) val = day['tasbih'] as int;
                  if (_activeTab == 2) val = day['categoriesCount'] as int;

                  final ratio = val / maxVal;
                  final height = ratio * 150.0;
                  final label = isArabic ? day['dayLabelAr'] as String : day['dayLabelEn'] as String;

                  return Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Value tooltip
                      Text(
                        '$val',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: val > 0 ? activeColor : Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Bar
                      Container(
                        width: 24,
                        height: 140,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.bottomCenter,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 24,
                          height: val > 0 ? (height < 10 ? 10.0 : height) : 0.0,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                activeColor.withValues(alpha: 0.7),
                                activeColor,
                              ],
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: val > 0
                                ? [
                                    BoxShadow(
                                      color: activeColor.withValues(alpha: 0.3),
                                      blurRadius: 4,
                                      offset: const Offset(0, -1),
                                    ),
                                  ]
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Day Name
                      Text(
                        label,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyLogList(
    BuildContext context,
    List<Map<String, dynamic>> stats,
    bool isArabic,
    AppLocalizations localizations,
  ) {
    // Reverse stats to show most recent first
    final reversedStats = stats.reversed.toList();

    return Column(
      children: reversedStats.map((day) {
        final date = day['date'] as String;
        final label = isArabic ? day['dayLabelAr'] as String : day['dayLabelEn'] as String;
        final salawat = day['salawat'] as int;
        final tasbih = day['tasbih'] as int;
        final categoriesCount = day['categoriesCount'] as int;

        final isToday = date == _getTodayKey();

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: isToday
                ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 1.5)
                : BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.15)),
          ),
          child: ExpansionTile(
            title: Row(
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isToday ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  date,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                        fontSize: 11,
                      ),
                ),
                if (isToday) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isArabic ? 'اليوم' : 'Today',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
            subtitle: Text(
              isArabic
                  ? 'صلوات: $salawat | تسبيح: $tasbih | أوراد مكتملة: $categoriesCount'
                  : 'Salawat: $salawat | Tasbih: $tasbih | Completed: $categoriesCount',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
            ),
            leading: Icon(
              Icons.analytics_outlined,
              color: isToday ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Column(
                  children: [
                    const Divider(),
                    _buildLogDetailRow(
                      context,
                      Icons.favorite,
                      Colors.red,
                      isArabic ? 'الصلوات على النبي ﷺ' : 'Salawat (Prayers upon Prophet ﷺ)',
                      '$salawat',
                    ),
                    const SizedBox(height: 8),
                    _buildLogDetailRow(
                      context,
                      Icons.radar,
                      Colors.teal,
                      isArabic ? 'تكرار التسبيح والأذكار الحرة' : 'Tasbih Count (Free Tasbih)',
                      '$tasbih',
                    ),
                    const SizedBox(height: 8),
                    _buildLogDetailRow(
                      context,
                      Icons.brightness_3,
                      Colors.purple,
                      isArabic ? 'الأذكار اليومية المكتملة' : 'Daily Adhkar Categories Completed',
                      '$categoriesCount',
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLogDetailRow(BuildContext context, IconData icon, Color color, String title, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
        ),
      ],
    );
  }

  String _getTodayKey() {
    final now = DateTime.now();
    return "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
  }
}
