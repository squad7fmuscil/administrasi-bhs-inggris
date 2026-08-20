@echo off
title Aplikasi Administrasi Bahasa Inggris Vite React
color 1F
echo ================================================
echo          VITE + REACT DEVELOPMENT SERVER
echo ================================================
echo.
echo [*] Memulai aplikasi...
echo.

cd /d "D:\Aplikasi Produksi\Administrasi Bahasa Inggris"

if not exist "package.json" (
    echo [ERROR] File package.json tidak ditemukan!
    echo Pastikan folder aplikasi sudah benar.
    echo.
    pause
    exit
)

if not exist "vite.config.js" (
    echo [ERROR] File vite.config.js tidak ditemukan!
    echo Pastikan ini adalah project Vite.
    echo.
    pause
    exit
)

echo [*] Menjalankan npm start...
echo.
echo ================================================
echo.
echo [INFO] Server akan berjalan di: http://localhost:3000
echo [INFO] Tekan CTRL + C untuk menghentikan server
echo.
echo ================================================
echo.

REM Jalanin server di jendela terpisah biar gak nge-block script ini
start "Vite Dev Server" cmd /k "npm run dev"

REM Kasih jeda dikit biar server sempet nyala duluan sebelum Chrome dibuka
timeout /t 4 /nobreak >nul

REM Buka khusus di Chrome, pake localhost (BUKAN 192.168.x.x) biar
REM localStorage/cookie konsisten satu origin terus tiap kali testing
echo [*] Membuka aplikasi di Google Chrome...

set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME_PATH (
    start "" "%CHROME_PATH%" "http://localhost:3000"
) else (
    echo [WARNING] chrome.exe gak ketemu di lokasi standar.
    echo [WARNING] Membuka pakai browser default sebagai gantinya...
    start "" "http://localhost:3000"
)

echo.
echo ================================================
echo [*] Server jalan di jendela terpisah. Tutup jendela
echo     "Vite Dev Server" itu buat matiin server-nya.
echo ================================================
echo.
pause
exit