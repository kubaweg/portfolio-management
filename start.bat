@echo off
:: Uruchamiamy dwie zakładki w Windows Terminalu z nadanymi tytułami
start "" ^
   ; wt -w 0 nt --title "Starting browser..." cmd /c "echo App starting in 3 seconds... && timeout /t 3 >nul && start chrome http://localhost:3000" ^
   ; nt --title "Backend (uv)" -d . cmd /k "title Backend && uv run uvicorn app:app --reload --port 8000" ^
   ; nt --title "Frontend (npm)" -d .\frontend cmd /k "title Frontend && npm run dev" ^
""