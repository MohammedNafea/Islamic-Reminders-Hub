class Reciter {
  final String id;
  final String name;
  final String englishName;
  final String type; // "ayah" | "surah"
  final String? audioEditionId;
  final String surahBaseUrl;

  const Reciter({
    required this.id,
    required this.name,
    required this.englishName,
    required this.type,
    this.audioEditionId,
    required this.surahBaseUrl,
  });
}
