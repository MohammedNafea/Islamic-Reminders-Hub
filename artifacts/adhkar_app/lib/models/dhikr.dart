class Dhikr {
  final String id;
  final String arabic;
  final String? english;
  final String? transliteration;
  final String source;
  final int count;
  final String time; // e.g. "morning", "evening", "both", "night_only", "day_full", "sleep", "prayer"
  final String? morningVariant;
  final String? eveningVariant;
  final String? note;
  final String? benefitKey;

  const Dhikr({
    required this.id,
    required this.arabic,
    this.english,
    this.transliteration,
    required this.source,
    required this.count,
    required this.time,
    this.morningVariant,
    this.eveningVariant,
    this.note,
    this.benefitKey,
  });
}
