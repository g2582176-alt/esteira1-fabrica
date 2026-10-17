/**
 * Skill: gerar_memory_md
 * Gera o arquivo MEMORY.md inicial para um agente
 */

function gerarMemoryMd(estrutura) {
    return `# MEMORY.md - ${estrutura.nome}

## Identidade
- Nome: ${estrutura.nome}
- Criado: ${new Date().toISOString()}
- Versao: 1.0

## Historico de Execucoes

## Aprendizados

## Proximos Passos
- Executar primeiro loop
- Validar funcionamento
- Ajustar se necessario
`;
}

module.exports = { gerarMemoryMd };
