import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:http/http.dart' as http;
import '../models/reciter.dart';
import '../data/reciters_data.dart';

class AudioPlayerProvider extends ChangeNotifier {
  final AudioPlayer _player = AudioPlayer();

  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double _playbackSpeed = 1.0;
  Reciter _reciter = reciters[0]; // Default reciter (Husary)
  
  int? _currentSurahNumber;
  String? _currentSurahName;
  String? _currentSurahEnglishName;

  int? _activeAyahIndex;
  int? _playingSingleAyahId;
  bool _autoplay = true;

  // Ayah mode variables
  List<String> _ayahUrls = [];

  // Getters
  bool get isPlaying => _isPlaying;
  Duration get position => _position;
  Duration get duration => _duration;
  double get playbackSpeed => _playbackSpeed;
  Reciter get reciter => _reciter;
  int? get currentSurahNumber => _currentSurahNumber;
  String? get currentSurahName => _currentSurahName;
  String? get currentSurahEnglishName => _currentSurahEnglishName;
  int? get activeAyahIndex => _activeAyahIndex;
  int? get playingSingleAyahId => _playingSingleAyahId;
  bool get autoplay => _autoplay;
  bool get isSurahMode => _reciter.type == 'surah';

  AudioPlayerProvider() {
    _initPlayer();
  }

  void _initPlayer() {
    // Listen to player state
    _player.playerStateStream.listen((state) {
      _isPlaying = state.playing;
      if (state.processingState == ProcessingState.completed) {
        _handlePlaybackCompleted();
      }
      notifyListeners();
    });

    // Listen to position
    _player.positionStream.listen((pos) {
      _position = pos;
      notifyListeners();
    });

    // Listen to duration
    _player.durationStream.listen((dur) {
      _duration = dur ?? Duration.zero;
      notifyListeners();
    });
  }

  void setReciter(Reciter reciter) {
    _reciter = reciter;
    notifyListeners();
  }

  Future<void> setPlaybackSpeed(double speed) async {
    _playbackSpeed = speed;
    await _player.setSpeed(speed);
    notifyListeners();
  }

  void toggleAutoplay() {
    _autoplay = !_autoplay;
    notifyListeners();
  }

  Future<void> togglePlay() async {
    if (_isPlaying) {
      await _player.pause();
    } else {
      if (_currentSurahNumber != null) {
        await _player.play();
      }
    }
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  // Play entire Surah
  Future<void> playSurah({
    required int surahNumber,
    required String name,
    required String englishName,
    int? startAyahIndex,
  }) async {
    try {
      await _player.stop();
      _currentSurahNumber = surahNumber;
      _currentSurahName = name;
      _currentSurahEnglishName = englishName;
      _activeAyahIndex = startAyahIndex;
      _playingSingleAyahId = null;

      if (isSurahMode) {
        final padded = surahNumber.toString().padLeft(3, '0');
        final url = "${_reciter.surahBaseUrl}$padded.mp3";
        await _player.setUrl(url);
        await _player.play();
      } else {
        // Ayah mode: Fetch audio urls for all ayahs in the surah
        // If we already have them for this surah, don't refetch
        _ayahUrls = await _fetchAyahAudioUrls(surahNumber, _reciter.audioEditionId ?? 'ar.husary');
        if (_ayahUrls.isNotEmpty) {
          final index = startAyahIndex ?? 0;
          _activeAyahIndex = index;
          await _player.setUrl(_ayahUrls[index]);
          await _player.play();
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint("Error playing surah: $e");
    }
  }

  // Play single Ayah
  Future<void> playSingleAyah({
    required int surahNumber,
    required String surahName,
    required String surahEnglishName,
    required int ayahNumber,
    required String url,
  }) async {
    try {
      await _player.stop();
      _currentSurahNumber = surahNumber;
      _currentSurahName = surahName;
      _currentSurahEnglishName = surahEnglishName;
      _activeAyahIndex = null;
      _playingSingleAyahId = ayahNumber;

      await _player.setUrl(url);
      await _player.play();
      notifyListeners();
    } catch (e) {
      debugPrint("Error playing single ayah: $e");
    }
  }

  Future<void> next() async {
    if (_currentSurahNumber == null) return;
    if (isSurahMode) {
      if (_currentSurahNumber! < 114) {
        // Play next surah
        // We need metadata for the next surah - since we don't have the whole surahs list here, we just increment and let the UI trigger it, or trigger it locally with generic names or fetched names.
        // For simplicity, we can let the UI handle next/prev or define surah basic metadata list.
      }
    } else {
      if (_activeAyahIndex != null && _activeAyahIndex! < _ayahUrls.length - 1) {
        final nextIndex = _activeAyahIndex! + 1;
        _activeAyahIndex = nextIndex;
        await _player.stop();
        await _player.setUrl(_ayahUrls[nextIndex]);
        await _player.play();
        notifyListeners();
      }
    }
  }

  Future<void> previous() async {
    if (_currentSurahNumber == null) return;
    if (isSurahMode) {
      if (_currentSurahNumber! > 1) {
        // Play previous surah
      }
    } else {
      if (_activeAyahIndex != null && _activeAyahIndex! > 0) {
        final prevIndex = _activeAyahIndex! - 1;
        _activeAyahIndex = prevIndex;
        await _player.stop();
        await _player.setUrl(_ayahUrls[prevIndex]);
        await _player.play();
        notifyListeners();
      }
    }
  }

  Future<void> _handlePlaybackCompleted() async {
    if (!isSurahMode && _activeAyahIndex != null && _ayahUrls.isNotEmpty) {
      if (_autoplay && _activeAyahIndex! < _ayahUrls.length - 1) {
        final nextIndex = _activeAyahIndex! + 1;
        _activeAyahIndex = nextIndex;
        try {
          await _player.setUrl(_ayahUrls[nextIndex]);
          await _player.play();
        } catch (e) {
          debugPrint("Error autoplaying next ayah: $e");
        }
      } else {
        _activeAyahIndex = null;
        _isPlaying = false;
      }
    } else {
      _isPlaying = false;
      _playingSingleAyahId = null;
    }
    notifyListeners();
  }

  Future<List<String>> _fetchAyahAudioUrls(int surahNumber, String edition) async {
    try {
      final response = await http.get(Uri.parse("https://api.alquran.cloud/v1/surah/$surahNumber/$edition"));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final ayahs = data['data']['ayahs'] as List;
        return ayahs.map<String>((ayah) => ayah['audio'] as String).toList();
      }
    } catch (e) {
      debugPrint("Error fetching ayah audio: $e");
    }
    return [];
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }
}
