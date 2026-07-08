# ArqFlow

## Ferramenta de gestão para arquitetos

**Versão:** 0.1 (MVP)

---

# Visão Geral

O ArqFlow é uma plataforma que permite que arquitetos organizem projetos e organizem o andamento deles.

O objetivo é reduzir a dependência de WhatsApp, e-mails e arquivos espalhados em diferentes plataformas.

A aplicação possui um fluxo de registro de projetos , com etapas e pipeline de atualização.

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

O ArchitectFlow centraliza todas as informações do projeto em um único local.

Fluxo básico:

Arquiteto → Registra clientes

↓

Cria projetos vinculados aos clientes

↓

Atualiza andamento

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
* Editar status / etapa
* Log de atualizações
* Inserção de fotos
* Listar projetos

### Atualizações

* Adicionar atualização ao projeto

Exemplos:

* Briefing concluído
* Primeira planta enviada
* Render finalizado

---

# Status do Projeto

ENUM

* BRIEFING
* PROJETO
* REVISAO
* CONCLUIDO

ENUM

---

# Regras de Acesso

## ARCHITECT

Pode:

* Criar clientes
* Criar projetos
* Atualizar projetos

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
* photo

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
