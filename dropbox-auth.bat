@echo off
echo Abra no navegador:
echo https://www.dropbox.com/oauth2/authorize?client_id=ym36yayzcaneiqk^&response_type=code^&token_access_type=offline
echo.
set /p code="Cole o codigo aqui: "
curl -s -X POST https://api.dropboxapi.com/oauth2/token -d code=%code% -d grant_type=authorization_code -d client_id=ym36yayzcaneiqk -d client_secret=hz344iow0uijox8 > dropbox_response.json
type dropbox_response.json
pause