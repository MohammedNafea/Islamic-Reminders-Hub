import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../providers/settings_provider.dart';

class CurrencyInfo {
  final String code;
  final String symbolAr;
  final String symbolEn;
  final String nameAr;
  final String nameEn;
  final String flag;

  const CurrencyInfo({
    required this.code,
    required this.symbolAr,
    required this.symbolEn,
    required this.nameAr,
    required this.nameEn,
    required this.flag,
  });
}

class ZakatScreen extends StatefulWidget {
  const ZakatScreen({super.key});

  @override
  State<ZakatScreen> createState() => _ZakatScreenState();
}

class _ZakatScreenState extends State<ZakatScreen> {
  static const List<CurrencyInfo> _currencies = [
    CurrencyInfo(code: "SAR", symbolAr: "ر.س", symbolEn: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", flag: "🇸🇦"),
    CurrencyInfo(code: "AED", symbolAr: "د.إ", symbolEn: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", flag: "🇦🇪"),
    CurrencyInfo(code: "KWD", symbolAr: "د.ك", symbolEn: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", flag: "🇰🇼"),
    CurrencyInfo(code: "QAR", symbolAr: "ر.ق", symbolEn: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", flag: "🇶🇦"),
    CurrencyInfo(code: "BHD", symbolAr: "د.ب", symbolEn: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", flag: "🇧🇭"),
    CurrencyInfo(code: "OMR", symbolAr: "ر.ع", symbolEn: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial", flag: "🇴🇲"),
    CurrencyInfo(code: "EGP", symbolAr: "ج.م", symbolEn: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound", flag: "🇪🇬"),
    CurrencyInfo(code: "JOD", symbolAr: "د.أ", symbolEn: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar", flag: "🇯🇴"),
    CurrencyInfo(code: "DZD", symbolAr: "د.ج", symbolEn: "DZD", nameAr: "دينار جزائري", nameEn: "Algerian Dinar", flag: "🇩🇿"),
    CurrencyInfo(code: "MAD", symbolAr: "د.م", symbolEn: "MAD", nameAr: "درهم مغربي", nameEn: "Moroccan Dirham", flag: "🇲🇦"),
    CurrencyInfo(code: "USD", symbolAr: "\$", symbolEn: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", flag: "🇺🇸"),
    CurrencyInfo(code: "EUR", symbolAr: "€", symbolEn: "EUR", nameAr: "يورو", nameEn: "Euro", flag: "🇪🇺"),
    CurrencyInfo(code: "GBP", symbolAr: "£", symbolEn: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound", flag: "🇬🇧"),
  ];

  static const Map<String, double> _defaultRates = {
    'USD': 1.0,
    'SAR': 3.75,
    'AED': 3.6725,
    'KWD': 0.307,
    'QAR': 3.64,
    'BHD': 0.376,
    'OMR': 0.384,
    'EGP': 47.0,
    'JOD': 0.709,
    'DZD': 134.5,
    'MAD': 10.0,
    'EUR': 0.92,
    'GBP': 0.79,
  };

  CurrencyInfo _selectedCurrency = _currencies[0]; // Default SAR
  double _goldUSD = 75.55; // Default gold price per gram in USD
  double _silverUSD = 0.90; // Default silver price per gram in USD
  final Map<String, double> _rates = Map.from(_defaultRates);
  String _updatedAt = "";

  bool _loading = false;
  String? _error;

  final TextEditingController _cashController = TextEditingController();
  final TextEditingController _tradeController = TextEditingController();
  final TextEditingController _goldWeightController = TextEditingController();
  final TextEditingController _silverWeightController = TextEditingController();
  final TextEditingController _debtsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchPrices();
    _cashController.addListener(_calculateResults);
    _tradeController.addListener(_calculateResults);
    _goldWeightController.addListener(_calculateResults);
    _silverWeightController.addListener(_calculateResults);
    _debtsController.addListener(_calculateResults);
  }

  @override
  void dispose() {
    _cashController.dispose();
    _tradeController.dispose();
    _goldWeightController.dispose();
    _silverWeightController.dispose();
    _debtsController.dispose();
    super.dispose();
  }

  Future<void> _fetchPrices() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final resGoldFuture = http.get(Uri.parse("https://api.gold-api.com/price/XAU"));
      final resSilverFuture = http.get(Uri.parse("https://api.gold-api.com/price/XAG"));
      final resRatesFuture = http.get(Uri.parse("https://open.er-api.com/v6/latest/USD"));

      final responses = await Future.wait([resGoldFuture, resSilverFuture, resRatesFuture]);

      if (responses[0].statusCode == 200 && responses[1].statusCode == 200) {
        final goldData = json.decode(responses[0].body);
        final silverData = json.decode(responses[1].body);

        if (goldData['price'] != null && silverData['price'] != null) {
          // XAU & XAG are priced in USD per troy ounce (31.1034768 grams)
          _goldUSD = (goldData['price'] as num) / 31.1034768;
          _silverUSD = (silverData['price'] as num) / 31.1034768;
        }

        if (responses[2].statusCode == 200) {
          final ratesData = json.decode(responses[2].body);
          if (ratesData['rates'] != null) {
            final fetchedRates = ratesData['rates'] as Map<String, dynamic>;
            for (var curr in _currencies) {
              if (fetchedRates[curr.code] != null) {
                _rates[curr.code] = (fetchedRates[curr.code] as num).toDouble();
              }
            }
          }
        }

        final now = DateTime.now();
        _updatedAt = "${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";
      } else {
        throw Exception("Failed to fetch rates");
      }
    } catch (e) {
      debugPrint("Error fetching Zakat prices: $e");
      setState(() {
        _error = "خطأ في الاتصال بالشبكة، تم استخدام الأسعار المخزنة محلياً";
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  // Calculated state values
  double _totalWealth = 0;
  double _zakatAmountDue = 0;
  double _nisabValue = 0;
  bool _isEligible = false;

  void _calculateResults() {
    final cash = double.tryParse(_cashController.text) ?? 0.0;
    final trade = double.tryParse(_tradeController.text) ?? 0.0;
    final goldWeight = double.tryParse(_goldWeightController.text) ?? 0.0;
    final silverWeight = double.tryParse(_silverWeightController.text) ?? 0.0;
    final debts = double.tryParse(_debtsController.text) ?? 0.0;

    final rate = _rates[_selectedCurrency.code] ?? 1.0;
    final goldPrice = _goldUSD * rate;
    final silverPrice = _silverUSD * rate;

    _nisabValue = 85 * goldPrice;
    _totalWealth = cash + (goldWeight * goldPrice) + (silverWeight * silverPrice) + trade - debts;

    if (_totalWealth >= _nisabValue) {
      _isEligible = true;
      _zakatAmountDue = _totalWealth * 0.025;
    } else {
      _isEligible = false;
      _zakatAmountDue = 0.0;
    }

    setState(() {});
  }

  void _changeCurrency(CurrencyInfo currency) {
    setState(() {
      _selectedCurrency = currency;
      _calculateResults();
    });
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final settings = Provider.of<SettingsProvider>(context);
    final theme = Theme.of(context);
    final isArabic = settings.languageCode == 'ar';
    final isWide = MediaQuery.of(context).size.width >= 900;

    final rate = _rates[_selectedCurrency.code] ?? 1.0;
    final goldPrice = _goldUSD * rate;
    final silverPrice = _silverUSD * rate;
    final currencySymbol = isArabic ? _selectedCurrency.symbolAr : _selectedCurrency.symbolEn;

    final inputSection = Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.savings_outlined, color: theme.colorScheme.secondary),
                const SizedBox(width: 8),
                Text(
                  localizations.translate('zakat_assets_input'),
                  style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildInputField(
              label: localizations.translate('zakat_cash'),
              controller: _cashController,
              suffix: currencySymbol,
              icon: Icons.money,
              color: const Color(0xFF10B981),
            ),
            const SizedBox(height: 16),
            _buildInputField(
              label: localizations.translate('zakat_trade'),
              controller: _tradeController,
              suffix: currencySymbol,
              icon: Icons.shopping_bag,
              color: Colors.blue,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInputField(
                    label: isArabic ? "وزن الذهب عيار 24" : "Gold (grams)",
                    controller: _goldWeightController,
                    suffix: isArabic ? "جرام" : "g",
                    icon: Icons.brightness_high,
                    color: Colors.amber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInputField(
                    label: isArabic ? "وزن الفضة" : "Silver (grams)",
                    controller: _silverWeightController,
                    suffix: isArabic ? "جرام" : "g",
                    icon: Icons.circle_outlined,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInputField(
              label: localizations.translate('zakat_debts'),
              controller: _debtsController,
              suffix: currencySymbol,
              icon: Icons.warning_amber_rounded,
              color: Colors.red,
            ),
          ],
        ),
      ),
    );

    final marketPricesSection = Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.trending_up, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      localizations.translate('zakat_market_prices'),
                      style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.refresh, color: theme.colorScheme.primary),
                  onPressed: _loading ? null : _fetchPrices,
                ),
              ],
            ),
            const Divider(height: 16),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.wifi_off, color: Colors.amber, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(fontSize: 11, color: Colors.amber),
                      ),
                    ),
                  ],
                ),
              ),
            // Currency dropdown
            DropdownButtonFormField<CurrencyInfo>(
              initialValue: _selectedCurrency,
              decoration: InputDecoration(
                labelText: isArabic ? "عملة الحساب" : "Currency",
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: _currencies.map((curr) {
                return DropdownMenuItem<CurrencyInfo>(
                  value: curr,
                  child: Row(
                    children: [
                      Text(curr.flag),
                      const SizedBox(width: 8),
                      Text(curr.code),
                      const SizedBox(width: 8),
                      Text(
                        '(${isArabic ? curr.nameAr : curr.nameEn})',
                        style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  _changeCurrency(val);
                }
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMarketPriceCard(
                    context,
                    localizations.translate('zakat_gold_price'),
                    "${goldPrice.toStringAsFixed(2)} $currencySymbol",
                    Colors.amber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMarketPriceCard(
                    context,
                    localizations.translate('zakat_silver_price'),
                    "${silverPrice.toStringAsFixed(2)} $currencySymbol",
                    Colors.grey,
                  ),
                ),
              ],
            ),
            if (_updatedAt.isNotEmpty) ...[
              const SizedBox(height: 12),
              Center(
                child: Text(
                  isArabic ? "آخر تحديث مباشر: $_updatedAt" : "Last Live Update: $_updatedAt",
                  style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
                ),
              ),
            ],
          ],
        ),
      ),
    );

    final summarySection = Card(
      color: _isEligible ? theme.colorScheme.primary : theme.colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Text(
              localizations.translate('zakat_result_title'),
              style: theme.textTheme.titleMedium?.copyWith(
                    color: _isEligible ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              localizations.translate('zakat_total_wealth'),
              style: theme.textTheme.bodySmall?.copyWith(
                    color: _isEligible ? theme.colorScheme.onPrimary.withValues(alpha: 0.7) : theme.colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              "${_totalWealth.toStringAsFixed(2)} $currencySymbol",
              style: theme.textTheme.headlineLarge?.copyWith(
                    color: _isEligible ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Divider(color: _isEligible ? theme.colorScheme.onPrimary.withValues(alpha: 0.2) : theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text(
              localizations.translate('zakat_amount_due'),
              style: theme.textTheme.bodySmall?.copyWith(
                    color: _isEligible ? theme.colorScheme.onPrimary.withValues(alpha: 0.7) : theme.colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              "${_zakatAmountDue.toStringAsFixed(2)} $currencySymbol",
              style: theme.textTheme.displayMedium?.copyWith(
                    color: _isEligible ? theme.colorScheme.secondary : theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: _isEligible
                    ? theme.colorScheme.secondary.withValues(alpha: 0.2)
                    : theme.colorScheme.outline.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _isEligible ? Icons.check_circle : Icons.info,
                    color: _isEligible ? theme.colorScheme.secondary : theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isEligible
                        ? localizations.translate('zakat_eligible')
                        : localizations.translate('zakat_not_eligible'),
                    style: TextStyle(
                      color: _isEligible ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    final nisabInfoCard = Card(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localizations.translate('zakat_nisab_info'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    localizations.translate('zakat_nisab_desc'),
                    style: theme.textTheme.bodySmall?.copyWith(
                          height: 1.5,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.translate('zakat_title')),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              Text(
                localizations.translate('zakat_subtitle'),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              if (isWide)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Column(
                        children: [
                          inputSection,
                          const SizedBox(height: 16),
                          marketPricesSection,
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 1,
                      child: Column(
                        children: [
                          summarySection,
                          const SizedBox(height: 16),
                          nisabInfoCard,
                        ],
                      ),
                    ),
                  ],
                )
              else
                Column(
                  children: [
                    inputSection,
                    const SizedBox(height: 16),
                    marketPricesSection,
                    const SizedBox(height: 16),
                    summarySection,
                    const SizedBox(height: 16),
                    nisabInfoCard,
                  ],
                ),
              const SizedBox(height: 32),
              _buildHadithSection(context, isArabic),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String suffix,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))],
          decoration: InputDecoration(
            border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
            suffixText: suffix,
            suffixStyle: const TextStyle(fontWeight: FontWeight.bold),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildMarketPriceCard(BuildContext context, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildHadithSection(BuildContext context, bool isArabic) {
    final theme = Theme.of(context);
    final hadiths = [
      {
        'source': isArabic ? 'متفق عليه' : 'Bukhari & Muslim',
        'text': isArabic
            ? 'أن النبي ﷺ بعث معاذًا إلى اليمن، فقال: «ادعهم إلى شهادة أن لا إله إلا الله وأن محمدًا رسول الله، فإن هم أطاعوا لذلك، فأعلمهم أن الله افترض عليهم خمس صلوات في كل يوم وليلة، فإن هم أطاعوا لذلك، فأعلمهم أن الله افترض عليهم صدقة في أموالهم تُؤخذ من أغنيائهم وتُرد على فقرائهم».'
            : 'The Prophet ﷺ sent Mu\'adh to Yemen and said: "Invite them to testify that none has the right to be worshipped but Allah and that Muhammad is the Messenger of Allah. If they obey that, tell them that Allah has enjoined upon them five prayers every day and night. If they obey that, tell them that Allah has enjoined upon them Zakat (charity) on their wealth, to be taken from the rich among them and given to the poor among them."',
      },
      {
        'source': isArabic ? 'رواه مسلم' : 'Muslim',
        'text': isArabic
            ? 'قال رسول الله ﷺ: «ما من صاحب ذهب ولا فضة لا يؤدي منها حقها إلا إذا كان يوم القيامة صفحت له صفائح من نار فأحمي عليها في نار جهنم فيكوى بها جنبه وجبينه وظهره، كلما بردت أعيدت له في يوم كان مقداره خمسين ألف سنة حتى يقضى بين العباد».'
            : 'The Messenger of Allah ﷺ said: "No owner of gold or silver who does not pay what is due on them, but on the Day of Resurrection sheets of fire will be prepared for him, heated in the Fire of Hell, and his sides, forehead and back will be branded with them. Whenever they cool down, they will be returned to him on a Day the length of which is fifty thousand years, until judgment is passed among people."',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.book, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              isArabic ? "أحاديث في وجوب الزكاة" : "Hadiths on Zakat",
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...hadiths.map((hadith) {
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      hadith['source']!,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    hadith['text']!,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.6,
                      fontFamily: isArabic ? 'Amiri' : null,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
