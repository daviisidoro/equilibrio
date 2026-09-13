# Equilíbrio

Aplicativo React para acompanhar finanças e hábitos, com autenticação e sincronização pelo Firebase e um modo offline temporário.

## Recuperação do código

O ZIP e a versão atual da branch `main` não continham a pasta `src`. O componente original `equilibrio.jsx` foi recuperado do commit [`94557e7`](https://github.com/daviisidoro/equilibrio/commit/94557e71543bc1dd0edcb5086b4bbadacd4a37e2), anterior ao commit que o excluiu. Ele foi colocado em `src/App.jsx`, junto com o ponto de entrada e o CSS necessários para o Vite.

## Rodar localmente

Testado com Node.js 24.

```bash
npm ci
npm run dev
```

Para conferir antes de publicar:

```bash
npm run lint
npm run build
```

O modo offline permite testar sem entrar no Firebase, mas os dados ficam só na memória e desaparecem ao recarregar a página. Para usar autenticação e sincronização, configure no console do Firebase os métodos de login desejados, os domínios autorizados e as regras do Firestore para que cada usuário acesse apenas seus próprios dados.

## Enviar ao GitHub

No diretório do projeto, use um clone do repositório e copie para ele os arquivos desta versão recuperada (sem `node_modules` e `dist`). Depois:

```bash
git add .
git commit -m "Recupera aplicativo e corrige build"
git push origin main
```

Se aparecer um erro de autenticação no `git push`, entre na sua conta pelo GitHub Desktop ou configure a autenticação do Git para sua conta. Não inclua senhas, tokens ou arquivos `.env` no commit.
