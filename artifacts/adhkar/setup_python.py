import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

packages = ["pypdf", "pdfplumber", "pymupdf"]

print("--- Islamic Reminders Hub - Python Setup ---")
for package in packages:
    try:
        print(f"Installing {package}...")
        install(package)
        print(f"Successfully installed {package}")
    except Exception as e:
        print(f"Failed to install {package}: {e}")

print("-------------------------------------------")
print("Python environment setup complete. All PDF modules should now be available.")
