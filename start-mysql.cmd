@echo off
cd /d "%~dp0"
echo Starting MySQL Server...
start "" /B "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="%cd%\.mysql-data3"
echo MySQL started in the background.