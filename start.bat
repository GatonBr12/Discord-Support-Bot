@echo off
title Bot D&G Developments
echo Iniciando o bot D&G Developments...

:loop
node index.js
echo O bot foi encerrado ou ocorreu um erro. Reiniciando em 5 segundos...
timeout /t 5 >nul
goto loop