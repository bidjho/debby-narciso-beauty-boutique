# Debby Narciso Beauty Boutique

Loja online de cosméticos construída com React, TypeScript, TanStack Start, Vite e Supabase. O catálogo, carrinho, checkout por WhatsApp e área administrativa estão implementados; veja `roadmap.md` para o estado atual do projeto.

## Requisitos

- Bun (recomendado; o repositório inclui `bun.lock`)
- Acesso ao projeto Supabase/Lovable associado à loja

## Configuração local

1. Clone o repositório e instale as dependências:

   ```sh
   git clone https://github.com/bidjho/debby-narciso-beauty-boutique.git
   cd debby-narciso-beauty-boutique
   bun install
   ```

2. Crie o arquivo local de ambiente a partir do modelo:

   ```sh
   cp .env.example .env
   ```

   Preencha as variáveis com os valores do projeto Supabase. `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são usadas no navegador; `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são usadas no servidor. A chave publishable pode ser exposta no navegador, mas nunca coloque uma chave `service_role`, senha ou outro segredo em variáveis `VITE_*`.

3. Inicie o servidor de desenvolvimento:

   ```sh
   bun run dev
   ```

## Comandos

```sh
bun run dev       # desenvolvimento
bun run build     # build de produção
bun run preview   # pré-visualizar o build
bun run lint      # ESLint
bun run test      # testes automatizados
```

## Backend e segurança

O backend usa Supabase e políticas RLS. Configure as variáveis de ambiente no ambiente de execução/deploy e confirme que o projeto Supabase correspondente está configurado. Não publique valores de `.env` nem credenciais em commits. As alterações do esquema e da base de dados são geridas pelo Lovable; siga as regras em `AGENTS.md` e não edite manualmente as migrações.

## Estado do projeto

Consulte [`roadmap.md`](roadmap.md). O logótipo usado pela aplicação é um asset gerido pelo Lovable; o ficheiro original exportável ainda não está incluído no repositório.
