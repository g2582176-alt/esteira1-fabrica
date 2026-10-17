/**
 * Skill: gerar_agents_md
 * Gera o arquivo AGENTS.md para um agente
 */

function gerarAgentsMd(estrutura) {
    return `# Agente: ${estrutura.nome}

## Papel
${estrutura.papel || 'Agente generico'}

## Descricao
${estrutura.descricao || 'Novo agente'}

## Componentes
${(estrutura.componentes || []).map(c => '- ' + c).join('\n')}

## Loop de Operacao
1. PERCEBER - Coletar contexto
2. PENSAR - Processar informacoes
3. AGIR - Executar acoes
4. REPETIR - Registrar aprendizado

## Skills
${(estrutura.skills_necessarias || []).map(s => '- ' + s).join('\n')}

## Ferramentas (MCP)
${(estrutura.ferramentas || []).map(f => '- ' + f).join('\n')}
`;
}

module.exports = { gerarAgentsMd };
