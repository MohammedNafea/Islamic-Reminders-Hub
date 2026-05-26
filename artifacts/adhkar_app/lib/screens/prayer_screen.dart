import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../providers/settings_provider.dart';

class PrayerTimes {
  final String fajr;
  final String sunrise;
  final String dhuhr;
  final String asr;
  final String maghrib;
  final String isha;

  const PrayerTimes({
    required this.fajr,
    required this.sunrise,
    required this.dhuhr,
    required this.asr,
    required this.maghrib,
    required this.isha,
  });

  factory PrayerTimes.fromJson(Map<String, dynamic> json) {
    return PrayerTimes(
      fajr: json['Fajr'] ?? "05:00",
      sunrise: json['Sunrise'] ?? "06:30",
      dhuhr: json['Dhuhr'] ?? "12:30",
      asr: json['Asr'] ?? "15:45",
      maghrib: json['Maghrib'] ?? "18:45",
      isha: json['Isha'] ?? "20:15",
    );
  }

  factory PrayerTimes.defaults() {
    return const PrayerTimes(
      fajr: "04:55",
      sunrise: "06:22",
      dhuhr: "12:20",
      asr: "15:40",
      maghrib: "18:25",
      isha: "19:50",
    );
  }
}

class PrayerScreen extends StatefulWidget {
  const PrayerScreen({super.key});

  @override
  State<PrayerScreen> createState() => _PrayerScreenState();
}

class _PrayerScreenState extends State<PrayerScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  
  // Location and Prayer Times
  String _cityName = "مكة المكرمة";
  PrayerTimes _prayerTimes = PrayerTimes.defaults();
  bool _loadingTimes = true;
  
  // Qibla Compass
  double? _direction;
  double _qiblaAngle = 0.0;
  bool _hasCompass = true;
  StreamSubscription? _compassSubscription;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initAppServices();
  }

  Future<void> _initAppServices() async {
    await _determinePosition();
    _initCompass();
  }

  Future<void> _determinePosition() async {
    setState(() {
      _loadingTimes = true;
    });

    final settings = Provider.of<SettingsProvider>(context, listen: false);
    if (settings.latOverride != null && settings.lngOverride != null) {
      final lat = settings.latOverride!;
      final lng = settings.lngOverride!;
      final city = settings.cityOverride ?? (settings.languageCode == 'ar' ? 'موقع مخصص' : 'Custom Location');
      _calculateQiblaAngle(lat, lng);
      await _fetchPrayerTimes(lat, lng);
      setState(() {
        _cityName = city;
        _loadingTimes = false;
      });
      return;
    }

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _fallbackToMakkah();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _fallbackToMakkah();
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _fallbackToMakkah();
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
        ),
      );
      
      _calculateQiblaAngle(position.latitude, position.longitude);
      await _fetchPrayerTimes(position.latitude, position.longitude);
      await _fetchCityName(position.latitude, position.longitude);
    } catch (e) {
      debugPrint("Error getting location: $e");
      _fallbackToMakkah();
    }
  }

  Future<void> _searchCityAndSet(String cityName, SettingsProvider settings) async {
    if (cityName.trim().isEmpty) return;
    setState(() {
      _loadingTimes = true;
    });
    try {
      final response = await http.get(Uri.parse(
        "https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(cityName)}&format=json&limit=1"
      ));
      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
        if (data.isNotEmpty) {
          final lat = double.parse(data[0]['lat']);
          final lng = double.parse(data[0]['lon']);
          final displayName = data[0]['display_name'] as String;
          final shortName = displayName.split(',')[0];
          await settings.setLocationOverride(lat, lng, shortName);
          _calculateQiblaAngle(lat, lng);
          await _fetchPrayerTimes(lat, lng);
          setState(() {
            _cityName = shortName;
            _loadingTimes = false;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(settings.languageCode == 'ar' 
                ? 'تم تحديث الموقع بنجاح لـ $shortName' 
                : 'Location updated successfully to $shortName'),
            ));
          }
        } else {
          setState(() { _loadingTimes = false; });
          if (mounted) {
            _showErrorDialog(settings.languageCode == 'ar'
              ? 'تعذر العثور على المدينة. يرجى التحقق من الاسم.'
              : 'City not found. Please check spelling.');
          }
        }
      } else {
        throw Exception("Search failed");
      }
    } catch (e) {
      setState(() { _loadingTimes = false; });
      if (mounted) {
        _showErrorDialog(settings.languageCode == 'ar'
          ? 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.'
          : 'Search error occurred. Please try again.');
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Icon(Icons.error_outline, color: Colors.red, size: 40),
        content: Text(message, textAlign: TextAlign.center),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showLocationDialog(SettingsProvider settings, bool isArabic) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            isArabic ? 'إعدادات الموقع الجغرافي' : 'Location Settings',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // GPS Button
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    settings.clearLocationOverride();
                    _determinePosition();
                  },
                  icon: const Icon(Icons.gps_fixed),
                  label: Text(isArabic ? 'تحديد تلقائي عبر GPS' : 'Detect Automatically (GPS)'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: Text(
                        isArabic ? 'أو إدخال يدوي' : 'Or Manual Input',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    labelText: isArabic ? 'اسم المدينة' : 'City Name',
                    hintText: isArabic ? 'مثال: القاهرة، مكة...' : 'e.g. Cairo, Mecca...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    final city = controller.text.trim();
                    if (city.isNotEmpty) {
                      Navigator.pop(context);
                      _searchCityAndSet(city, settings);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(isArabic ? 'بحث وتعيين' : 'Search & Set'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _fallbackToMakkah() {
    // Makkah coordinates
    const lat = 21.4225;
    const lng = 39.8262;
    _calculateQiblaAngle(lat, lng);
    _fetchPrayerTimes(lat, lng);
    setState(() {
      _cityName = "مكة المكرمة (افتراضي)";
      _loadingTimes = false;
    });
  }

  void _calculateQiblaAngle(double lat, double lng) {
    // Makkah coordinates
    const double mLat = 21.4225 * (math.pi / 180);
    const double mLng = 39.8262 * (math.pi / 180);
    final double uLat = lat * (math.pi / 180);
    final double uLng = lng * (math.pi / 180);

    final double y = math.sin(mLng - uLng);
    final double x = math.cos(uLat) * math.tan(mLat) - math.sin(uLat) * math.cos(mLng - uLng);
    double qiblaAngle = math.atan2(y, x) * (180 / math.pi);
    
    setState(() {
      _qiblaAngle = (qiblaAngle + 360) % 360;
    });
  }

  Future<void> _fetchPrayerTimes(double lat, double lng) async {
    try {
      final now = DateTime.now();
      final dateStr = "${now.day}-${now.month}-${now.year}";
      // Umm Al-Qura calculation method = 4
      final response = await http.get(Uri.parse(
        "https://api.aladhan.com/v1/timings/$dateStr?latitude=$lat&longitude=$lng&method=4"
      ));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final timings = data['data']['timings'];
        setState(() {
          _prayerTimes = PrayerTimes.fromJson(timings);
          _loadingTimes = false;
        });
      } else {
        throw Exception("Failed to fetch timings");
      }
    } catch (e) {
      debugPrint("Error fetching prayer times: $e");
      setState(() {
        _prayerTimes = PrayerTimes.defaults();
        _loadingTimes = false;
      });
    }
  }

  Future<void> _fetchCityName(double lat, double lng) async {
    try {
      final response = await http.get(Uri.parse(
        "https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json"
      ));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['address'];
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['county'] ?? "";
        if (city.isNotEmpty) {
          setState(() {
            _cityName = city;
          });
        }
      }
    } catch (e) {
      debugPrint("Error getting city: $e");
    }
  }

  void _initCompass() {
    try {
      _compassSubscription = FlutterCompass.events?.listen((CompassEvent event) {
        if (mounted) {
          setState(() {
            _direction = event.heading;
          });
        }
      }, onError: (e) {
        debugPrint("Compass error: $e");
        setState(() {
          _hasCompass = false;
        });
      });
    } catch (e) {
      debugPrint("Failed to initialize compass: $e");
      setState(() {
        _hasCompass = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _compassSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final isArabic = settings.languageCode == 'ar';
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.translate('nav_prayer')),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
          tabs: [
            Tab(text: localizations.translate('prayer_today_prayers')),
            Tab(text: localizations.translate('prayer_qibla_direction')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPrayerTimesTab(theme, isArabic, localizations),
          _buildQiblaCompassTab(theme, isArabic, localizations),
        ],
      ),
    );
  }

  Widget _buildPrayerTimesTab(ThemeData theme, bool isArabic, AppLocalizations localizations) {
    if (_loadingTimes) {
      return const Center(child: CircularProgressIndicator());
    }

    final prayers = [
      {'name': localizations.translate('prayer_fajr'), 'time': _prayerTimes.fajr, 'id': 'fajr'},
      {'name': localizations.translate('prayer_sunrise'), 'time': _prayerTimes.sunrise, 'id': 'sunrise'},
      {'name': localizations.translate('prayer_dhuhr'), 'time': _prayerTimes.dhuhr, 'id': 'dhuhr'},
      {'name': localizations.translate('prayer_asr'), 'time': _prayerTimes.asr, 'id': 'asr'},
      {'name': localizations.translate('prayer_maghrib'), 'time': _prayerTimes.maghrib, 'id': 'maghrib'},
      {'name': localizations.translate('prayer_isha'), 'time': _prayerTimes.isha, 'id': 'isha'},
    ];

    // Compute simple next prayer highlight
    String nextPrayerName = "";
    final now = DateTime.now();
    for (var prayer in prayers) {
      final parts = prayer['time']!.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1].split(' ')[0]);
      final prayerTime = DateTime(now.year, now.month, now.day, hour, minute);
      if (prayerTime.isAfter(now)) {
        nextPrayerName = prayer['name']!;
        break;
      }
    }
    if (nextPrayerName.isEmpty) {
      nextPrayerName = prayers[0]['name']!; // Fajr tomorrow
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Location banner card
          Card(
            color: theme.colorScheme.primary.withValues(alpha: 0.05),
            child: Consumer<SettingsProvider>(
              builder: (context, settings, _) {
                final hasOverride = settings.latOverride != null;
                return ListTile(
                  onTap: () => _showLocationDialog(settings, isArabic),
                  leading: Icon(Icons.location_on, color: theme.colorScheme.primary),
                  title: Text(
                    _cityName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    hasOverride
                        ? (isArabic ? 'موقع مخصص يدوياً' : 'Manual custom location')
                        : (isArabic ? 'حساب مواقيت الصلاة تلقائياً' : 'Calculated prayer times automatically'),
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: Icon(Icons.edit, color: theme.colorScheme.primary),
                );
              }
            ),
          ),
          const SizedBox(height: 16),
          // Prayer list
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: prayers.length,
            itemBuilder: (context, index) {
              final prayer = prayers[index];
              final isNext = prayer['name'] == nextPrayerName;

              return Card(
                color: isNext ? theme.colorScheme.primary : theme.colorScheme.surface,
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.access_time_filled,
                            color: isNext ? theme.colorScheme.onPrimary : theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 16),
                          Text(
                            prayer['name']!,
                            style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isNext ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                                ),
                          ),
                        ],
                      ),
                      Text(
                        prayer['time']!,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'monospace',
                          color: isNext ? theme.colorScheme.secondary : theme.colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQiblaCompassTab(ThemeData theme, bool isArabic, AppLocalizations localizations) {
    final double heading = _direction ?? 0.0;
    // Compass rotates in negative direction of heading
    final double compassRotation = -heading * (math.pi / 180);
    // Needle points to Qibla angle minus current heading
    final double needleRotation = (_qiblaAngle - heading) * (math.pi / 180);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          Text(
            localizations.translate('prayer_qibla_subtitle'),
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Text(
            "${localizations.translate('prayer_qibla_degree')}: ${double.parse(_qiblaAngle.toStringAsFixed(1))}° ${localizations.translate('prayer_qibla_from_north')}",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 40),
          if (!_hasCompass)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.error, color: Colors.red),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'البوصلة غير مدعومة على هذا الجهاز. يمكنك الاستعانة بالزاوية بالنسبة للشمال الجغرافي.',
                      style: TextStyle(fontSize: 12, color: Colors.red),
                    ),
                  ),
                ],
              ),
            )
          else
            Center(
              child: SizedBox(
                width: 250,
                height: 250,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer compass dial (rotates with heading)
                    Transform.rotate(
                      angle: compassRotation,
                      child: Image.network(
                        "https://i.imgur.com/x49W84P.png",
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          // Fallback custom custom painter for dial
                          return Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: theme.colorScheme.primary, width: 4),
                              color: theme.colorScheme.surface,
                            ),
                            child: const Stack(
                              alignment: Alignment.center,
                              children: [
                                Positioned(top: 8, child: Text('N', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red))),
                                Positioned(bottom: 8, child: Text('S', style: TextStyle(fontWeight: FontWeight.bold))),
                                Positioned(left: 8, child: Text('W', style: TextStyle(fontWeight: FontWeight.bold))),
                                Positioned(right: 8, child: Text('E', style: TextStyle(fontWeight: FontWeight.bold))),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    // Inner pointer pointing to Kaaba
                    Transform.rotate(
                      angle: needleRotation,
                      child: Container(
                        height: 160,
                        width: 160,
                        alignment: Alignment.topCenter,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.location_on,
                              color: theme.colorScheme.secondary,
                              size: 36,
                            ),
                            Container(
                              width: 4,
                              height: 60,
                              color: theme.colorScheme.secondary,
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Center Mosque Icon
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withValues(alpha: 0.3),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.mosque,
                        color: theme.colorScheme.onPrimary,
                        size: 28,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 48),
          // User guide info card
          Card(
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localizations.translate('prayer_qibla_guide'),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    localizations.translate('prayer_qibla_hint'),
                    style: const TextStyle(fontSize: 12, height: 1.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
