# InstaAPI - Instagram Profile Analysis Module

Uma solução completa de análise de perfis do Instagram para integração em sistemas SaaS, com arquitetura de microsserviços, análise por IA e suporte para múltiplas redes sociais.

## 🎯 Objetivo

Permitir que usuários busquem perfis do Instagram apenas digitando o @username, capturando automaticamente dados públicos e gerando análises inteligentes usando Gemini AI.

## 🏗️ Arquitetura

```
InstaAPI (Monorepo)
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js Dashboard
├── packages/
│   └── shared/           # Tipos e utilitários compartilhados
├── database/             # Prisma ORM e Migrações
└── docs/                 # Documentação
```

## 🛠️ Tecnologias

### Backend
- **Framework**: NestJS 10+
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Queue**: BullMQ
- **API External**: Apify para scraping Instagram
- **AI**: Google Gemini
- **Auth**: JWT
- **Validation**: Class Validator & Transformer

### Frontend
- **Framework**: Next.js 15
- **UI**: TailwindCSS + Shadcn UI
- **State**: React Query + Zustand
- **Forms**: React Hook Form
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm (recomendado)

## 📋 Funcionalidades

### 1. Busca de Perfil
- Validação de username
- Captura de dados públicos do Instagram
- Armazenamento estruturado em banco de dados

**Dados Retornados:**
- Username, nome completo, biografia
- Foto de perfil, seguidores, seguindo, publicações
- Categoria, link do perfil, data da consulta

### 2. Busca de Posts
- Captura dos últimos 30 posts
- Extração de metadados (curtidas, comentários)
- Identificação de hashtags

### 3. Dashboard Responsivo
- Grid de publicações (3 colunas desktop, 2 tablet, 1 mobile)
- Modal de visualização de posts
- Estatísticas em tempo real

### 4. Análise por IA
- Identificação de nicho
- Tom de voz e público-alvo
- Frequência de postagem
- Nível de engajamento
- Análise de posicionamento
- Prognóstico de crescimento

### 5. Fila de Processamento
- Processamento assíncrono com BullMQ
- Evita travamento da interface
- Suporte para análises em background

### 6. Segurança
- Autenticação JWT
- Rate limiting
- Logs auditáveis
- Controle de acesso
- Tratamento estruturado de erros

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Setup Inicial

```bash
# Clonar repositório
git clone <repo-url>
cd InstaAPI

# Instalar dependências (usando pnpm)
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar containers Docker
docker-compose up -d

# Executar migrações do banco
pnpm db:migrate

# Seed inicial (opcional)
pnpm db:seed

# Iniciar desenvolvimento
pnpm dev
```

Acesso:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## 📊 Escalabilidade

A arquitetura foi projetada para suportar **100.000+ consultas por dia**:

### Estratégias Implementadas

1. **Cache Multi-Camada**
   - Redis para dados de perfil (TTL: 24h)
   - Revalidação automática com ISR no Next.js

2. **Database Optimization**
   - Índices inteligentes em campos de consulta frequente
   - Particionamento de dados históricos
   - Connection pooling com Prisma

3. **Queue Processing**
   - Análise de IA executada em background
   - Processamento paralelo com BullMQ
   - Retry automático com exponential backoff

4. **API Efficiency**
   - Paginação de dados
   - Lazy loading de recursos
   - Compressão de resposta (gzip)
   - Validation antes do processamento

5. **Infrastructure**
   - Load balancing
   - Horizontal scaling com Kubernetes
   - CDN para assets estáticos
   - Database replication

## 🔄 Fluxo de Dados

```
Usuario digita @username
        ↓
Validação de input
        ↓
Verificação de cache Redis
        ↓
Se não cached: Chamada Apify Instagram Actor
        ↓
Armazenamento em PostgreSQL
        ↓
Envio para fila BullMQ
        ↓
Processamento assíncrono Gemini AI
        ↓
Atualização de análise no banco
        ↓
Exibição no dashboard
        ↓
Cache Redis atualizado
```

## 📚 Estrutura de Dados

### Principal Tables
- **Users**: Usuários do SaaS
- **InstagramProfile**: Perfis analisados
- **InstagramPost**: Posts capturados
- **InstagramAnalysis**: Análises de IA
- **AnalysisAudit**: Log de auditoria

### Relacionamentos
```
Users (1) ---> (N) InstagramProfile
InstagramProfile (1) ---> (N) InstagramPost
InstagramProfile (1) ---> (1) InstagramAnalysis
InstagramProfile (1) ---> (N) AnalysisAudit
```

## 🔐 Segurança

- ✅ Autenticação JWT com refresh tokens
- ✅ Rate limiting (100 req/15min por padrão)
- ✅ Validação de input com Zod/Class Validator
- ✅ Criptografia de dados sensíveis
- ✅ HTTPS obrigatório em produção
- ✅ CORS configurável
- ✅ Logs estruturados e auditáveis
- ✅ Controle de acesso baseado em roles

## 📈 Extensibilidade Futura

A arquitetura permite fácil adição de:
- Análise de influência digital
- Perfil comportamental
- Perfil de compra
- Análise política
- Perfil empreendedor
- Score de reputação digital
- Integração com TikTok, LinkedIn, YouTube, etc.

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes de integração
pnpm test:integration

# Cobertura
pnpm test:coverage

# E2E
pnpm test:e2e
```

## 📖 Documentação

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)

## 🤝 Contribuindo

1. Create feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open Pull Request

## 📝 Licença

MIT License - veja LICENSE.md para detalhes

## 📧 Contato

Para dúvidas ou sugestões: support@instaapi.com

---

**Última atualização**: Junho 2026
