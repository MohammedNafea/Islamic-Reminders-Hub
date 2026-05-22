import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../core/storage/app_storage.dart';
import '../providers/tracker_provider.dart';

class TasbihScreen extends StatefulWidget {
  const TasbihScreen({super.key});

  @override
  State<TasbihScreen> createState() => _TasbihScreenState();
}

class _TasbihScreenState extends State<TasbihScreen> with SingleTickerProviderStateMixin {
  int _counter = 0;
  int _target = 33;
  bool _vibrate = true;
  int _completedSets = 0;

  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  void _loadSettings() {
    setState(() {
      _target = AppStorage.getTasbihTarget();
      _vibrate = AppStorage.getTasbihVibrate();
      _completedSets = AppStorage.getCompletedTasbihCount();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _incrementCounter(TrackerProvider tracker) {
    _animationController.forward().then((_) => _animationController.reverse());

    if (_vibrate) {
      HapticFeedback.lightImpact();
    }

    setState(() {
      _counter++;
      if (_counter >= _target) {
        _counter = 0;
        _completedSets++;
        tracker.addCompletedTasbih(1);
        if (_vibrate) {
          HapticFeedback.vibrate(); // Heavy vibration for target completion
        }
        _showCompletionBanner();
      }
    });
  }

  void _resetCounter() {
    setState(() {
      _counter = 0;
    });
    if (_vibrate) {
      HapticFeedback.mediumImpact();
    }
  }

  void _setTarget(int newTarget) async {
    setState(() {
      _target = newTarget;
      _counter = 0;
    });
    await AppStorage.setTasbihTarget(newTarget);
    if (_vibrate) {
      HapticFeedback.selectionClick();
    }
  }

  void _toggleVibrate(bool? value) async {
    if (value == null) return;
    setState(() {
      _vibrate = value;
    });
    await AppStorage.setTasbihVibrate(value);
  }

  void _showCompletionBanner() {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              "${AppLocalizations.of(context)!.translate('common_done')} !",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showCustomTargetDialog() {
    final controller = TextEditingController(text: _target.toString());
    showDialog(
      context: context,
      builder: (context) {
        final localizations = AppLocalizations.of(context)!;
        return AlertDialog(
          title: Text(localizations.translate('tasbih_set_target')),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              suffixText: 'مرة',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(localizations.translate('common_cancel')),
            ),
            ElevatedButton(
              onPressed: () {
                final val = int.tryParse(controller.text);
                if (val != null && val > 0) {
                  _setTarget(val);
                }
                Navigator.pop(context);
              },
              child: Text(localizations.translate('common_save')),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final tracker = Provider.of<TrackerProvider>(context);
    final theme = Theme.of(context);
    final isWide = MediaQuery.of(context).size.width >= 700;

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.translate('tasbih_title')),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              if (isWide) const SizedBox(height: 40),
              // Controls row: Vibration, Sound, Target
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Vibrate Toggle
                      Row(
                        children: [
                          Icon(Icons.vibration, color: theme.colorScheme.primary),
                          const SizedBox(width: 4),
                          Text(localizations.translate('tasbih_vibrate')),
                          Switch(
                            value: _vibrate,
                            onChanged: _toggleVibrate,
                            activeThumbColor: theme.colorScheme.primary,
                          ),
                        ],
                      ),
                      // Target Presets
                      Row(
                        children: [
                          _buildPresetButton(33),
                          const SizedBox(width: 6),
                          _buildPresetButton(99),
                          const SizedBox(width: 6),
                          _buildPresetButton(100),
                          const SizedBox(width: 6),
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: _showCustomTargetDialog,
                            tooltip: localizations.translate('tasbih_custom'),
                            color: theme.colorScheme.primary,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Counter and Main Tap Target
              GestureDetector(
                onTap: () => _incrementCounter(tracker),
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Center(
                    child: Container(
                      width: isWide ? 320 : 260,
                      height: isWide ? 320 : 260,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: theme.colorScheme.primary.withValues(alpha: 0.05),
                        border: Border.all(
                          color: theme.colorScheme.primary.withValues(alpha: 0.2),
                          width: 8,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withValues(alpha: 0.08),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Circular Progress Indicator
                          SizedBox(
                            width: isWide ? 290 : 230,
                            height: isWide ? 290 : 230,
                            child: CircularProgressIndicator(
                              value: _target > 0 ? _counter / _target : 0.0,
                              strokeWidth: 10,
                              backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.2),
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          // Content Inside Circle
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                localizations.translate('tasbih_count'),
                                style: theme.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.0,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$_counter',
                                style: theme.textTheme.displayLarge?.copyWith(
                                      fontSize: isWide ? 72 : 56,
                                      fontWeight: FontWeight.bold,
                                      color: theme.colorScheme.primary,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.secondary.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${localizations.translate('tasbih_target')}: $_target',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurface,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              // Action Buttons & Set count summary
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton.icon(
                    onPressed: _resetCounter,
                    icon: const Icon(Icons.refresh),
                    label: Text(localizations.translate('tasbih_reset')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.surface,
                      foregroundColor: theme.colorScheme.primary,
                      side: BorderSide(color: theme.colorScheme.primary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn(
                        context,
                        '$_completedSets',
                        'مجموعات اليوم',
                      ),
                      Container(
                        height: 40,
                        width: 1,
                        color: theme.colorScheme.outline.withValues(alpha: 0.5),
                      ),
                      _buildStatColumn(
                        context,
                        '${tracker.tasbihCompletedCount * _target + _counter}',
                        'إجمالي التسبيحات اليوم',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPresetButton(int value) {
    final isSelected = _target == value;
    final theme = Theme.of(context);
    return InkWell(
      onTap: () => _setTarget(value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outline.withValues(alpha: 0.5),
          ),
        ),
        child: Text(
          '$value',
          style: TextStyle(
            color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildStatColumn(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}
