import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../core/localization/app_localizations.dart';
import '../core/theme/app_theme.dart';
import '../providers/settings_provider.dart';
import '../providers/audio_player_provider.dart';
import '../models/surah.dart';
import '../data/surah_list_data.dart';
import '../data/reciters_data.dart';

class QuranScreen extends StatefulWidget {
  const QuranScreen({super.key});

  @override
  State<QuranScreen> createState() => _QuranScreenState();
}

class _QuranScreenState extends State<QuranScreen> {
  Surah? _activeSurah;
  bool _isLoading = false;
  String _searchQuery = '';
  List<dynamic> _ayahs = [];
  List<dynamic> _translations = [];
  List<dynamic> _tafsirs = [];
  
  final ScrollController _ayahsScrollController = ScrollController();
  final Map<int, GlobalKey> _ayahKeys = {};

  @override
  void dispose() {
    _ayahsScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadSurah(Surah surah, String langCode) async {
    setState(() {
      _isLoading = true;
      _ayahs = [];
      _translations = [];
      _tafsirs = [];
      _ayahKeys.clear();
    });

    try {
      final translationEdition = langCode == 'en' ? 'en.sahih' : (langCode == 'am' ? 'am.sadiq' : 'ar.muyassar');
      
      // Fetch concurrently to speed up loading
      final responses = await Future.wait([
        http.get(Uri.parse("https://api.alquran.cloud/v1/surah/${surah.number}/quran-simple")),
        http.get(Uri.parse("https://api.alquran.cloud/v1/surah/${surah.number}/$translationEdition")),
        http.get(Uri.parse("https://api.alquran.cloud/v1/surah/${surah.number}/ar.muyassar")),
      ]);

      if (responses[0].statusCode == 200 && responses[1].statusCode == 200 && responses[2].statusCode == 200) {
        final ayahsData = json.decode(responses[0].body)['data']['ayahs'] as List;
        final transData = json.decode(responses[1].body)['data']['ayahs'] as List;
        final tafsirData = json.decode(responses[2].body)['data']['ayahs'] as List;

        setState(() {
          _ayahs = ayahsData;
          _translations = transData;
          _tafsirs = tafsirData;
          _activeSurah = surah;
          _isLoading = false;
        });

        // Initialize Keys for auto-scrolling
        for (int i = 0; i < _ayahs.length; i++) {
          _ayahKeys[i] = GlobalKey();
        }
      } else {
        throw Exception("Failed to load surah data");
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              langCode == 'ar' ? 'فشل تحميل السورة. يرجى التحقق من اتصال الإنترنت.' : 'Failed to load Surah. Please check your internet connection.',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _scrollToAyah(int index) {
    final key = _ayahKeys[index];
    if (key != null && key.currentContext != null) {
      Scrollable.ensureVisible(
        key.currentContext!,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.5,
      );
    }
  }

  String _cleanBismillah(String text, int surahNumber) {
    // Keep Bismillah if it's Surah Fatihah (surah 1) or Surah 9 (no Bismillah)
    if (surahNumber == 1 || surahNumber == 9) return text;
    
    const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    if (text.startsWith(bismillah)) {
      return text.substring(bismillah.length).trim();
    }
    
    const bismillahAlt = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
    if (text.startsWith(bismillahAlt)) {
      return text.substring(bismillahAlt.length).trim();
    }
    return text;
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final audioProvider = Provider.of<AudioPlayerProvider>(context);

    // Auto-scroll to playing Ayah if active surah matches
    if (_activeSurah != null &&
        audioProvider.currentSurahNumber == _activeSurah!.number &&
        audioProvider.activeAyahIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToAyah(audioProvider.activeAyahIndex!);
      });
    }

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_activeSurah?.name ?? localizations.translate('nav_quran')),
          centerTitle: true,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                localizations.translate('common_loading'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      );
    }

    if (_activeSurah != null) {
      return _buildSurahReader(context, _activeSurah!, audioProvider, settings, localizations);
    }

    return _buildSurahIndex(context, audioProvider, settings, localizations);
  }

  Widget _buildSurahIndex(
    BuildContext context,
    AudioPlayerProvider audioProvider,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    final filteredSurahs = surahList.where((s) {
      final nameAr = s.name.toLowerCase();
      final nameEn = s.englishName.toLowerCase();
      final nameTrans = s.englishNameTranslation.toLowerCase();
      final query = _searchQuery.toLowerCase();
      return nameAr.contains(query) || nameEn.contains(query) || nameTrans.contains(query) || s.number.toString() == query;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          localizations.translate('nav_quran'),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
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
          // Reciter Selection Indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: InkWell(
              onTap: () => _showReciterSelector(context, audioProvider, localizations),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.record_voice_over, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizations.locale.languageCode == 'ar' ? 'القارئ الحالي' : 'Current Reciter',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            localizations.locale.languageCode == 'ar' ? audioProvider.reciter.name : audioProvider.reciter.englishName,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.arrow_drop_down, color: Theme.of(context).colorScheme.primary),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: filteredSurahs.length,
              itemBuilder: (context, index) {
                final surah = filteredSurahs[index];
                final isCurrentlyPlaying = audioProvider.currentSurahNumber == surah.number;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: isCurrentlyPlaying
                      ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.04)
                      : null,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(
                      color: isCurrentlyPlaying
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                      width: isCurrentlyPlaying ? 1.5 : 1.0,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        "${surah.number}",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          surah.englishName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          surah.name,
                          style: AppTheme.getArabicTextStyle(fontSize: 18, color: Theme.of(context).colorScheme.onSurface),
                        ),
                      ],
                    ),
                    subtitle: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "${surah.numberOfAyahs} ${localizations.locale.languageCode == 'ar' ? 'آيات' : 'Ayahs'}",
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          surah.revelationType == 'Meccan' 
                              ? (localizations.locale.languageCode == 'ar' ? 'مكية' : 'Meccan')
                              : (localizations.locale.languageCode == 'ar' ? 'مدنية' : 'Medinan'),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    onTap: () => _loadSurah(surah, settings.languageCode),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSurahReader(
    BuildContext context,
    Surah surah,
    AudioPlayerProvider audioProvider,
    SettingsProvider settings,
    AppLocalizations localizations,
  ) {
    final isArabic = settings.languageCode == 'ar';
    final isCurrentlyPlaying = audioProvider.currentSurahNumber == surah.number;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            setState(() {
              _activeSurah = null;
            });
          },
        ),
        title: Column(
          children: [
            Text(
              surah.name,
              style: AppTheme.getArabicTextStyle(fontSize: 20, color: Theme.of(context).colorScheme.onSurface),
            ),
            Text(
              surah.englishName,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(
              isCurrentlyPlaying && audioProvider.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
              color: Theme.of(context).colorScheme.primary,
              size: 28,
            ),
            onPressed: () {
              if (isCurrentlyPlaying) {
                audioProvider.togglePlay();
              } else {
                audioProvider.playSurah(
                  surahNumber: surah.number,
                  name: surah.name,
                  englishName: surah.englishName,
                );
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _ayahsScrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _ayahs.length + 1, // +1 for Bismillah / Header card
              itemBuilder: (context, index) {
                if (index == 0) {
                  // Surah header/Bismillah card
                  if (surah.number == 9) return const SizedBox.shrink(); // At-Tawbah has no Bismillah
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                      style: AppTheme.getArabicTextStyle(
                        fontSize: 24 * settings.fontSizeScale,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  );
                }

                final ayahIndex = index - 1;
                final ayah = _ayahs[ayahIndex];
                final translation = _translations[ayahIndex];
                final tafsir = _tafsirs[ayahIndex];
                
                final isAyahPlaying = isCurrentlyPlaying && audioProvider.activeAyahIndex == ayahIndex;

                final rawArabicText = ayah['text'] as String;
                final cleanText = _cleanBismillah(rawArabicText, surah.number);

                return Container(
                  key: _ayahKeys[ayahIndex],
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isAyahPlaying
                        ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.06)
                        : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isAyahPlaying
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                      width: isAyahPlaying ? 1.5 : 1.0,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Ayah Number and Action buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              "${ayah['numberInSurah']}",
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.comment_outlined, size: 20),
                                onPressed: () => _showTafsirBottomSheet(context, surah, ayah, tafsir, localizations),
                                tooltip: localizations.locale.languageCode == 'ar' ? 'التفسير الميسر' : 'Tafsir',
                              ),
                              IconButton(
                                icon: const Icon(Icons.copy, size: 20),
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: "$cleanText (${surah.name}:${ayah['numberInSurah']})"));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(localizations.translate('common_copied'))),
                                  );
                                },
                              ),
                              IconButton(
                                icon: Icon(
                                  isAyahPlaying ? Icons.pause : Icons.play_arrow,
                                  size: 20,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                onPressed: () {
                                  if (isAyahPlaying) {
                                    audioProvider.pause();
                                  } else {
                                    // Start playing Surah from this ayah
                                    audioProvider.playSurah(
                                      surahNumber: surah.number,
                                      name: surah.name,
                                      englishName: surah.englishName,
                                      startAyahIndex: ayahIndex,
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      
                      // Arabic text
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          cleanText,
                          style: AppTheme.getArabicTextStyle(
                            fontSize: 22 * settings.fontSizeScale,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // Translation
                      if (!isArabic)
                        Text(
                          translation['text'] as String,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                          textAlign: TextAlign.justify,
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          
          // Persistent Floating Player Bar
          if (isCurrentlyPlaying) _buildPlayerBar(context, audioProvider, localizations),
        ],
      ),
    );
  }

  Widget _buildPlayerBar(
    BuildContext context,
    AudioPlayerProvider audioProvider,
    AppLocalizations localizations,
  ) {
    String formatDuration(Duration d) {
      final seconds = d.inSeconds % 60;
      final minutes = d.inMinutes % 60;
      return "${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}";
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Audio info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  "${localizations.translate('prayer_next')}: ${localizations.locale.languageCode == 'ar' ? audioProvider.currentSurahName : audioProvider.currentSurahEnglishName}",
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              InkWell(
                onTap: () => _showSpeedMenu(context, audioProvider),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    "${audioProvider.playbackSpeed}x",
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
          
          // Slider
          Row(
            children: [
              Text(formatDuration(audioProvider.position), style: const TextStyle(fontSize: 11)),
              Expanded(
                child: Slider(
                  value: audioProvider.position.inMilliseconds.toDouble(),
                  max: audioProvider.duration.inMilliseconds.toDouble().clamp(1.0, double.infinity),
                  onChanged: (val) {
                    audioProvider.seek(Duration(milliseconds: val.toInt()));
                  },
                ),
              ),
              Text(formatDuration(audioProvider.duration), style: const TextStyle(fontSize: 11)),
            ],
          ),

          // Control buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.skip_previous),
                onPressed: audioProvider.previous,
              ),
              const SizedBox(width: 16),
              FloatingActionButton(
                mini: true,
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                onPressed: audioProvider.togglePlay,
                child: Icon(audioProvider.isPlaying ? Icons.pause : Icons.play_arrow),
              ),
              const SizedBox(width: 16),
              IconButton(
                icon: const Icon(Icons.skip_next),
                onPressed: audioProvider.next,
              ),
              const SizedBox(width: 24),
              // Autoplay switch
              IconButton(
                icon: Icon(
                  audioProvider.autoplay ? Icons.repeat : Icons.repeat_one,
                  color: audioProvider.autoplay ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                onPressed: audioProvider.toggleAutoplay,
                tooltip: localizations.locale.languageCode == 'ar' ? 'التشغيل التلقائي' : 'Autoplay next ayah',
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showReciterSelector(
    BuildContext context,
    AudioPlayerProvider audioProvider,
    AppLocalizations localizations,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                localizations.locale.languageCode == 'ar' ? 'اختر القارئ' : 'Choose Reciter',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const Divider(height: 24),
              Expanded(
                child: ListView.builder(
                  itemCount: reciters.length,
                  itemBuilder: (context, index) {
                    final qari = reciters[index];
                    final isSelected = audioProvider.reciter.id == qari.id;

                    return ListTile(
                      title: Text(
                        localizations.locale.languageCode == 'ar' ? qari.name : qari.englishName,
                        style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                      ),
                      subtitle: Text(
                        qari.type == 'surah'
                            ? (localizations.locale.languageCode == 'ar' ? 'رواية حفص عن عاصم (سورة كاملة)' : 'Surah Mode')
                            : (localizations.locale.languageCode == 'ar' ? 'تلاوة آية تلو آية (مع التكرار)' : 'Ayah Mode'),
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: isSelected
                          ? Icon(Icons.check_circle, color: Theme.of(context).colorScheme.primary)
                          : null,
                      onTap: () {
                        audioProvider.setReciter(qari);
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSpeedMenu(BuildContext context, AudioPlayerProvider audioProvider) {
    final speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'سرعة التشغيل',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: speeds.map((speed) {
                  final isSelected = audioProvider.playbackSpeed == speed;
                  return InkWell(
                    onTap: () {
                      audioProvider.setPlaybackSpeed(speed);
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.12) : null,
                        border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "${speed}x",
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? Theme.of(context).colorScheme.primary : null,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _showTafsirBottomSheet(
    BuildContext context,
    Surah surah,
    dynamic ayah,
    dynamic tafsir,
    AppLocalizations localizations,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.6,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    localizations.locale.languageCode == 'ar' ? 'التفسير الميسر' : 'Al-Muyassar Tafsir',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "${surah.name} : ${ayah['numberInSurah']}",
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _cleanBismillah(ayah['text'] as String, surah.number),
                        style: AppTheme.getArabicTextStyle(fontSize: 20, color: Theme.of(context).colorScheme.onSurface),
                        textAlign: TextAlign.right,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        tafsir['text'] as String,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              height: 1.6,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                        textAlign: TextAlign.justify,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                onPressed: () => Navigator.pop(context),
                child: Text(localizations.translate('common_close')),
              ),
            ],
          ),
        );
      },
    );
  }
}
