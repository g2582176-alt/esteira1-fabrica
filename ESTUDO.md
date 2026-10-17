ESTEIRA 6 - ESTUDO COMPLETO
Baseado no Video: A proxima revolucao dos agentes de IA

=============================================================

CAPITULO 1: O QUE E UM AGENTE DE IA?

Um agente de IA e um sistema que:
1. Percebe o ambiente
2. Toma decisoes
3. Executa acoes
4. Aprende com os resultados

DIFERENCA: Chatbot vs Agente
- Chatbot: Responde apenas
- Agente: Faz coisas acontecerem

=============================================================

CAPITULO 2: CONCEITOS DO VIDEO

NIVEL 1: AGENT LOOP
- PERCEBER -> PENSAR -> AGIR -> REPETIR

NIVEL 2: CONTEXTO (AGENTS.md)
- Define regras de comportamento
- Maximo 200 linhas

NIVEL 3: MEMORIA (MEMORY.md)
- Historico de medicoes
- Aprendizados acumulados
- Loop de auto-melhoria

NIVEL 4: FERRAMENTAS
- Skills: Tarefas reutilizaveis
- MCP: Conexao com servicos externos

NIVEL 5: AUTONOMIA
- Agentes de sessao vs 24 horas

=============================================================

CAPITULO 3: COMO A ESTEIRA 6 SEGUE O MODELO

NIVEL 1: AGENT LOOP

PERCEBER:
- Le shared/context.json
- Le shared/memory.json
- Analisa pedido

PENSAR (MiniMax):
- Usa IA para decidir estrutura
- Seleciona skills

AGIR:
- Cria pasta
- Gera AGENTS.md
- Gera MEMORY.md
- Cria script.js

REPETIR:
- Atualiza memoria

=============================================================

NIVEL 2: CONTEXTO
Arquivo AGENTS.md define:
- PAPEL
- OBJETIVO
- LOOP
- FERRAMENTAS

=============================================================

NIVEL 3: MEMORIA
Arquivo MEMORY.md:
- Historico de medicoes
- Aprendizados

Arquivo shared/memory.json:
- Memoria global

=============================================================

NIVEL 4: FERRAMENTAS

SKILLS (4):
- criar_estrutura.js
- gerar_agents_md.js
- gerar_memory_md.js
- implementar_loop.js

MCPs (4):
- mcp_github.js
- mcp_postgres.js
- mcp_http.js
- mcp_manager.js

=============================================================

NIVEL 5: AUTONOMIA
A Esteira 6 e um META-AGENTE:
- Cria outros agentes
- Toma decisoes sozinha
- Aprende com resultados

=============================================================

CAPITULO 4: FLUXO

1. INICIO -> Carrega contexto
2. PERCEBER -> Le arquivos
3. PENSAR -> Usa MiniMax
4. AGIR -> Cria estrutura
5. REPETIR -> Atualiza memoria
6. FIM -> Agentes criados

=============================================================

CAPITULO 5: COMPARATIVO

Conceito          | Esteira 6
------------------|-------------------
Agent Loop        | OK Perceber-Pensar-Agir-Repetir
AGENTS.md         | OK Raiz + agentes
MEMORY.md         | OK Raiz + agentes
Skills            | OK 4
MCP               | OK 4
MiniMax           | OK Fase PENSAR

=============================================================

CAPITULO 6: ARQUIVOS

- AGENTS.md - Regras
- MEMORY.md - Memoria
- esteira6.js - Script
- skills/ - 8 skills
- shared/ - Contextos

=============================================================

FIM
Data: 2026-10-17
