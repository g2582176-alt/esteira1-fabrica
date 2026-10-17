/**
 * Skill: implementar_loop
 * Implementa o loop Padrao Perceber->Pensar->Agir->Repetir
 */

function implementarLoop(nome) {
    const classeNome = nome.replace(/[^a-zA-Z]/g, '');
    
    return `/**
 * Agente: ${nome}
 * Loop: Perceber -> Pensar -> Agir -> Repetir
 */

class Agente${classeNome} {
    constructor() {
        this.nome = '${nome}';
        this.versao = '1.0';
    }

    async executar() {
        console.log('Iniciando: ' + this.nome);
        
        await this.perceber();
        await this.pensar();
        await this.agir();
        await this.repetir();
        
        console.log('Concluido: ' + this.nome);
    }

    async perceber() {
        console.log('[PERCEBER] Coletando contexto...');
    }

    async pensar() {
        console.log('[PENSAR] Processando informacoes...');
    }

    async agir() {
        console.log('[AGIR] Executando acao...');
    }

    async repetir() {
        console.log('[REPETIR] Registrando aprendizado...');
    }
}

module.exports = Agente${classeNome};
`;
}

module.exports = { implementarLoop };
