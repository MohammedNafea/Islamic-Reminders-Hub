// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:adhkar_app/core/storage/app_storage.dart';
import 'package:adhkar_app/main.dart';

void main() {
  setUp(() async {
    // Setup temporary directory for Hive in test environment
    final tempDir = Directory.systemTemp.createTempSync();
    Hive.init(tempDir.path);
    
    // Open required boxes
    final settingsBox = await Hive.openBox('settings');
    final trackerBox = await Hive.openBox('tracker');
    final favoritesBox = await Hive.openBox('favorites');
    
    // Inject the boxes to AppStorage
    AppStorage.setBoxesForTesting(settingsBox, trackerBox, favoritesBox);
  });

  testWidgets('Islamic Reminders Hub smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    // Verify that the mosque icon or logo is displayed on the main page.
    expect(find.byIcon(Icons.mosque), findsWidgets);
  });
}
