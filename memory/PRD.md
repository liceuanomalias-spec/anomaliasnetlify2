# PRD - AELC Lamego: Reporte de Anomalias

## Visão Geral
Aplicação mobile (Expo / React Native) para o Agrupamento de Escolas Latino Coelho de Lamego que permite a alunos e professores reportarem anomalias em instrumentos/espaços escolares (biblioteca, salas, corredores, etc.). Os reportes são guardados em base de dados e enviados por email para os destinatários configurados.

## Stack
- Frontend: Expo Router (React Native), TypeScript
- Backend: FastAPI (Python), Motor (MongoDB async)
- Email: Resend (transactional API)
- Auth: JWT custom (bcrypt para passwords)

## Funcionalidades
### Utilizadores normais
- Registo/Login com email institucional do domínio `@aelc-lamego.pt` (validação backend + frontend)
- Seleção do perfil após primeiro login (Aluno ou Professor)
- Submissão de reporte: Local da Anomalia (obrigatório), Número da Sala (opcional), Descrição (obrigatório), Informações Adicionais (opcional)
- Histórico de reportes próprios

### Admin
- Login separado com username `admin`
- Gestão dos emails destinatários (adicionar, ativar/desativar, remover)
- Visualização global de todos os reportes submetidos

## Endpoints (todos com prefixo /api)
- POST /auth/register — registo (valida domínio)
- POST /auth/login — login utilizador
- POST /auth/admin-login — login admin
- GET /auth/me — utilizador atual
- POST /user/type — definir perfil (aluno/professor)
- POST /reports — criar reporte (envia email)
- GET /reports/mine — histórico do utilizador
- GET /admin/reports — todos os reportes (admin)
- GET /admin/recipients — lista de destinatários (admin)
- POST /admin/recipients — adicionar destinatário (admin)
- PATCH /admin/recipients/{id}/toggle — ativar/desativar (admin)
- DELETE /admin/recipients/{id} — remover (admin)

## Configuração (backend/.env)
- RESEND_API_KEY: chave Resend
- EMAIL_SENDER: "AELC Lamego <onboarding@resend.dev>"
- DEFAULT_RECIPIENT: liceuanomalias@gmail.com (semente inicial; pode adicionar/remover via admin)
- ADMIN_USERNAME: admin
- ADMIN_PASSWORD: Admin@2026
- ALLOWED_DOMAIN: aelc-lamego.pt

## Nota Importante sobre Email (Resend)
A conta Resend está em **modo sandbox** — apenas pode enviar para `liceuanomalias@gmail.com` (a conta dona da API key). Para enviar para `nuno.ribeiro@aelc-lamego.pt` ou outros endereços, é necessário:
1. Verificar um domínio em https://resend.com/domains
2. Atualizar `EMAIL_SENDER` no `.env` com um endereço do domínio verificado (ex: `noreply@aelc-lamego.pt`)

Mesmo enquanto o domínio não está verificado, todos os reportes ficam guardados na base de dados e visíveis no painel admin.
