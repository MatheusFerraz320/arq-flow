# ArqFlow

## Portal de Aprovação e Acompanhamento de Projetos

**Versão:** 0.1 (MVP)

---

# Visão Geral

O ArqFlow é uma plataforma que permite que arquitetos organizem projetos e compartilhem o andamento com seus clientes.

O objetivo é reduzir a dependência de WhatsApp, e-mails e arquivos espalhados em diferentes plataformas.

O cliente possui acesso a um portal onde pode visualizar o status do projeto e acompanhar atualizações realizadas pelo arquiteto.

---

# Problema

Hoje muitos arquitetos utilizam:

* WhatsApp
* E-mail
* Google Drive
* PDFs enviados manualmente

Isso gera:

* Dificuldade para localizar informações
* Falta de histórico centralizado
* Retrabalho
* Comunicação descentralizada

Perguntas frequentes dos clientes:

* O projeto já foi aprovado?
* Existe alguma atualização?
* Qual é a próxima etapa?
* Em que fase estamos?

---

# Solução

O ArqFlow centraliza todas as informações do projeto em um único local.

Fluxo básico:

Arquiteto → Cria Projeto

↓

Atualiza andamento

↓

Cliente acompanha progresso

---

# Público-Alvo

### Inicial

* Arquitetos autônomos
* Pequenos escritórios de arquitetura

### Futuro

* Designers de interiores
* Engenheiros
* Marcenarias

---

# MVP

## Funcionalidades do Arquiteto

### Autenticação

* Login

### Clientes

* Criar cliente
* Listar clientes

### Projetos

* Criar projeto
* Editar status
* Listar projetos

### Atualizações

* Adicionar atualização ao projeto

Exemplos:

* Briefing concluído
* Primeira planta enviada
* Render finalizado

---

## Funcionalidades do Cliente

### Portal

Visualizar:

* Projetos
* Status atual
* Histórico de atualizações

---

# Fluxo Principal

### Cadastro

Arquiteto cria cliente

↓

Arquiteto cria projeto

↓

Cliente recebe acesso

---

### Atualização

Arquiteto adiciona atualização

↓

Atualização fica disponível no portal

↓

Cliente acompanha andamento

---

# Status do Projeto

* BRIEFING
* PROJETO
* REVISAO
* CONCLUIDO

---

# Regras de Acesso

## ARCHITECT

Pode:

* Criar clientes
* Criar projetos
* Atualizar projetos

## CLIENT

Pode:

* Visualizar seus próprios projetos
* Visualizar atualizações

---

# Estrutura Inicial do Banco

## users

* id
* name
* email
* password
* role

---

## clients

* id
* userId
* phone

---

## projects

* id
* clientId
* title
* description
* status

---

## project_updates

* id
* projectId
* message
* createdAt

---

# Stack

## Frontend

* Next.js
* TypeScript
* Tailwind
* Shadcn/ui

## Backend

* NestJS
* Prisma
* PostgreSQL

---

# Estrutura Inicial do NestJS

src/

├── auth/

├── clients/

├── projects/

├── project-updates/

├── prisma/

└── main.ts

---

# Roadmap

## V1

* Login
* Clientes
* Projetos
* Timeline de atualizações

## V2

* Upload de documentos
* Aprovação de etapas

## V3

* Comentários
* Notificações por e-mail

---

# Objetivo de Aprendizado

Este projeto foi propositalmente simplificado para permitir o aprendizado gradual de:

* Estrutura de módulos do NestJS
* Controllers
* Services
* Prisma ORM
* Relacionamentos no PostgreSQL
* Autenticação com JWT
* Integração com Next.js

Sem introduzir complexidades desnecessárias nas primeiras versões.
