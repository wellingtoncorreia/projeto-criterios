@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   INICIANDO CONFIGURACAO DE ESTRUTURA - PROJETO CRITERIOS
echo   Stack: Next.js 15 + App Router + TypeScript
echo ========================================================
echo.

REM --- 1. Verifica se a pasta src existe (Padrao Next.js moderno) ---
if not exist "src" (
    echo [AVISO] Pasta 'src' nao encontrada. Criando na raiz...
    mkdir src
)

REM --- 2. Camada de Rotas (App Router) ---
echo [1/4] Criando estrutura de Rotas (App Router)...
if not exist "app\dashboard" mkdir "app\dashboard"
if not exist "app\gestao\turmas" mkdir "app\gestao\turmas"
if not exist "app\gestao\disciplinas" mkdir "app\gestao\disciplinas"
if not exist "app\gestao\alunos" mkdir "app\gestao\alunos"
if not exist "app\avaliacoes" mkdir "app\avaliacoes"

REM --- 3. Camada de Arquitetura ---
echo [2/4] Criando pastas de Arquitetura...
if not exist "components\forms" mkdir "components\forms"
if not exist "components\ui" mkdir "components\ui"
if not exist "hooks" mkdir "hooks"
if not exist "services" mkdir "services"
if not exist "types" mkdir "types"
if not exist "utils" mkdir "utils"
if not exist "contexts" mkdir "contexts"

REM --- 4. Criando Arquivos Base (Placeholders) ---
echo [3/4] Gerando arquivos base...

REM Services
if not exist "services\api.ts" (
    echo // Configuracao do Axios > "services\api.ts"
)

REM Types
if not exist "types\index.ts" (
    echo // Interfaces globais > "types\index.ts"
)

REM Utils
if not exist "utils\formatters.ts" (
    echo // Funcoes auxiliares > "utils\formatters.ts"
)

echo.
echo ========================================================
echo   ESTRUTURA CRIADA COM SUCESSO!
echo ========================================================
echo.
echo Proximos passos:
echo 1. Copie o codigo das interfaces para 'src/types/index.ts'
echo 2. Configure o Axios em 'src/services/api.ts'
echo.
pause