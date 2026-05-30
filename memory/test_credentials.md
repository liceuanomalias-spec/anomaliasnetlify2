# Test Credentials — AELC Lamego

## Utilizador normal (criado durante testes do backend)
- Email: `teste@aelc-lamego.pt`
- Password: `Teste123`
- Tipo: professor (já definido)

## Para registar outro utilizador novo (use no teste):
- Email: qualquer `nome@aelc-lamego.pt` (ex: `aluno1@aelc-lamego.pt`)
- Password: mínimo 6 caracteres

## Admin
- Username: `admin`
- Password: `Admin@2026`
- Endpoint login admin: `POST /api/auth/admin-login`
- Login admin é via tela `/admin/login` no frontend

## Domain Restriction
- Apenas emails que terminam em `@aelc-lamego.pt` são aceites no registo/login normal
- Tentativas de outros domínios devem ser rejeitadas com erro

## Notas
- Registo cria utilizador com `user_type=null` — deve ser definido na tela `/user-type` antes de submeter reportes
- Submissão de reporte requer `user_type` definido (devolve 400 caso contrário)
- Resend está em modo sandbox: só envia para `liceuanomalias@gmail.com`; outros emails retornam erro mas o reporte é guardado normalmente (`email_sent: false`)
