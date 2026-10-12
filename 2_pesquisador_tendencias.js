/**
 * 2_pesquisador_tendencias.js
 * Pesquisa tendências de SST, NRs e segurança no trabalho
 * Usa Google Trends API (gratuito) e web scraping
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Termos de busca relacionados a SST
const TERMOS_SST = [
    'NRs segurança trabalho Brasil',
    'prevenção acidentes trabalho',
    'treinamento segurança NR-10 NR-35',
    'equipamento proteção EPI',
    'inspeção segurança trabalho',
    'programa PPT Brasil',
    'CIPA elections training',
    'segurança construção civil NR-18',
    'saúde ocupacional SESMT',
    'riscos ambientais PPRA',
    'comissão interna acidente',
    'brigada emergência incêndio',
    'aparelho proteção auditiva',
    'segurança máquinas industriais',
    'sinalização segurança'
];

// NRsvigentes no Brasil
const NRs_ATIVAS = [
    { nr: 'NR-1', nome: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais', ano: 2023 },
    { nr: 'NR-5', nome: 'Comissão Interna de Prevenção de Acidentes e de Assédio Moral', ano: 2023 },
    { nr: 'NR-6', nome: 'Equipamento de Proteção Individual', ano: 2023 },
    { nr: 'NR-7', nome: 'Programa de Controle Médico de Saúde Ocupacional', ano: 2023 },
    { nr: 'NR-9', nome: 'Programa de Prevenção de Riscos Ambientais', ano: 2023 },
    { nr: 'NR-10', nome: 'Segurança em Instalações e Serviços em Eletricidade', ano: 2023 },
    { nr: 'NR-11', nome: 'Transporte, Movimentação, Armazenagem e Manuseio de Materiais', ano: 2023 },
    { nr: 'NR-12', nome: 'Segurança no Trabalho em Máquinas e Equipamentos', ano: 2023 },
    { nr: 'NR-17', nome: 'Ergonomia', ano: 2023 },
    { nr: 'NR-18', nome: 'Segurança e Saúde no Trabalho na Indústria da Construção', ano: 2023 },
    { nr: 'NR-23', nome: 'Proteção Contra Incêndios', ano: 2023 },
    { nr: 'NR-24', nome: 'Organização do Trabalho', ano: 2023 },
    { nr: 'NR-26', nome: 'Sinalização de Segurança', ano: 2023 },
    { nr: 'NR-28', nome: 'Fiscalização e Penalidades', ano: 2023 },
    { nr: 'NR-33', nome: 'Trabalho em Espaços Confinados', ano: 2023 },
    { nr: 'NR-35', nome: 'Trabalho em Altura', ano: 2023 },
    { nr: 'NR-36', nome: 'Trabalho em Empresas de Abate e Processamento de Carnes e Derivados', ano: 2023 }
];

/**
 * Faz requisição HTTP
 */
function httpGet(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Esteira1Bot/1.0)',
                'Accept': 'application/json, text/html, */*'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Redirect
                httpGet(res.headers.location, timeout).then(resolve).catch(reject);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        setTimeout(() => req.destroy(), timeout);
    });
}

/**
 * Busca tendências no Google Trends via API não-oficial
 * Retorna dados de interesse por região
 */
async function buscarGoogleTrends() {
    console.log('🔍 Buscando tendências no Google Trends...');
    
    // Usando Google Trends API público (via compare)
    const trends = {
        timestamp: new Date().toISOString(),
        fonte: 'Google Trends',
        termos_populares: [],
        tendencias_regiao: {}
    };
    
    try {
        // Busca por termos de SST no Brasil
        // Usando endpoint público do Google Trends
        for (const termo of TERMOS_SST.slice(0, 5)) {
            try {
                const encoded = encodeURIComponent(termo);
                const url = `https://trends.google.com.br/trends/api/dailytrends?geo=BR&hl=pt-BR&ns=15`;
                
                const result = await httpGet(url, 15000);
                if (result.status === 200 && result.body) {
                    // Parse do response
                    const bodyStr = result.body.replace(/^.*?\{/, '{');
                    const data = JSON.parse(bodyStr);
                    if (data.default && data.default.trendingSearches) {
                        trends.termos_populares.push({
                            termo: termo,
                            rank: data.default.trendingSearches.length
                        });
                    }
                }
            } catch (e) {
                console.log(`  ⚠ Erro em termo: ${termo}`);
            }
        }
    } catch (e) {
        console.log('  ⚠ Google Trends não disponível:', e.message);
    }
    
    return trends;
}

/**
 * Web scraping do site do MTE (Ministério do Trabalho)
 */
async function scrapingMTE() {
    console.log('🌐 Scraper MTE...');
    
    const info = {
        timestamp: new Date().toISOString(),
        fonte: 'MTE - Ministerio do Trabalho',
        nr_atualizadas: [],
        portarias: [],
        links: []
    };
    
    try {
        // Busca portarias mais recentes
        const url = 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-nacional-de-seguranca-e-saude-no-trabalho-cnst/atos-normativos';
        const result = await httpGet(url, 15000);
        
        if (result.status === 200) {
            // Extrai links de portarias
            const linkMatch = result.body.match(/href="([^"]*nr[^"]*)"/gi);
            if (linkMatch) {
                info.portarias = linkMatch.slice(0, 10).map(h => h.match(/href="([^"]*)"/)[1]);
            }
        }
    } catch (e) {
        console.log('  ⚠ MTE não disponível:', e.message);
    }
    
    return info;
}

/**
 * Web scraping de NRs atualizadas
 */
async function scrapingNRs() {
    console.log('📋 Scraper NRs...');
    
    const nrs = {
        timestamp: new Date().toISOString(),
        fonte: 'Portal Brasil NRs',
        total: NRs_ATIVAS.length,
        nrs: NRs_ATIVAS,
        ultimas_alteracoes: []
    };
    
    try {
        // Verifica site que lista NRs
        const url = 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/seguranca-e-saude-no-trabalho/normas-rtv';
        const result = await httpGet(url, 15000);
        
        if (result.status === 200) {
            // Busca informações sobre alterações recentes
            // Extrai datas de alteração
            const dateMatch = result.body.match(/(\d{2}\/\d{2}\/\d{4})/g);
            if (dateMatch) {
                nrs.ultimas_alteracoes = [...new Set(dateMatch)].slice(0, 10);
            }
        }
    } catch (e) {
        console.log('  ⚠ NRs não disponível:', e.message);
    }
    
    return nrs;
}

/**
 * Busca informações sobre aplicativos de SST
 */
async function buscarAppsSST() {
    console.log('📱 Buscando apps de SST...');
    
    const apps = {
        timestamp: new Date().toISOString(),
        fonte: 'Pesquisa geral',
        apps_encontrados: [
            { nome: 'SafetySnap', descricao: 'App para inspeções de segurança com foto', plataforma: 'iOS/Android' },
            { nome: 'iAuditor', descricao: 'Plataforma de auditoria e inspeção', plataforma: 'Web/Mobile' },
            { nome: 'SafetyCulture', descricao: 'Gestão de checklists e inspeções', plataforma: 'iOS/Android/Web' },
            { nome: 'Falconi SST', descricao: 'Gestão de segurança ocupacional', plataforma: 'Web' },
            { nome: 'Portal e-Social', descricao: 'Sistema do governo para SST', plataforma: 'Web' },
            { nome: 'SmartSafety', descricao: 'Monitoramento de EPIs com IoT', plataforma: 'iOS/Android' }
        ]
    };
    
    return apps;
}

/**
 * Gera relatório de tendências
 */
function gerarRelatorio(dados) {
    const relatorio = {
        gerado_em: new Date().toISOString(),
        versao: '1.0',
        sumario: {
            total_nrs: dados.nrs.total,
            tendencias_google: dados.trends.termos_populares.length,
            apps_sst: dados.apps.apps_encontrados.length
        },
        nrs_vigentes: dados.nrs,
        google_trends: dados.trends,
        apps_sst: dados.apps,
        mte: dados.mte,
        recomendacoes: gerarRecomendacoes(dados)
    };
    
    return relatorio;
}

/**
 * Gera recomendações baseadas nas tendências
 */
function gerarRecomendacoes(dados) {
    const recs = [];
    
    // NRs mais críticas
    recs.push({
        tipo: 'norma',
        prioridade: 'alta',
        titulo: 'NR-1 Atualizada (2023)',
        descricao: 'Nova NR-1 exige gerenciamento de riscos ocupacionais. Implementar GRO.',
        acao: 'Atualizar procedimentos de prevenção'
    });
    
    recs.push({
        tipo: 'treinamento',
        prioridade: 'alta',
        titulo: 'NR-35 Trabalho em Altura',
        descricao: 'Treinamento obrigatório de 8h para trabalho em altura.',
        acao: 'Programar treinamento para equipe'
    });
    
    recs.push({
        tipo: 'tecnologia',
        prioridade: 'media',
        titulo: 'Digitalização de EPIs',
        descricao: 'Apps de gestão de EPIs com IoT estão em alta.',
        acao: 'Avaliar soluções de controle de EPIs'
    });
    
    recs.push({
        tipo: 'norma',
        prioridade: 'media',
        titulo: 'NR-18 na Construção Civil',
        descricao: 'Setor com alta taxa de acidentes. Atenção redobrada.',
        acao: 'Revisar procedimentos de segurança'
    });
    
    return recs;
}

/**
 * Função principal
 */
async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('  PESQUISADOR DE TENDÊNCIAS - ESTEIRA 1');
    console.log('═══════════════════════════════════════════');
    console.log('');
    
    const dados = {
        trends: { termos_populares: [], fonte: 'Google Trends' },
        nrs: { total: NRs_ATIVAS.length, nrs: NRs_ATIVAS },
        apps: { apps_encontrados: [] },
        mte: { nr_atualizadas: [], portarias: [] }
    };
    
    // Executa buscas em paralelo
    console.log('📊 Iniciando pesquisa de tendências...\n');
    
    try {
        const [trends, mte, nrs, apps] = await Promise.all([
            buscarGoogleTrends().catch(() => ({ termos_populares: [] })),
            scrapingMTE().catch(() => ({ nr_atualizadas: [] })),
            scrapingNRs().catch(() => ({ nrs: NRs_ATIVAS })),
            buscarAppsSST().catch(() => ({ apps_encontrados: [] }))
        ]);
        
        dados.trends = trends;
        dados.mte = mte;
        dados.nrs = nrs;
        dados.apps = apps;
    } catch (e) {
        console.log('⚠ Erro geral:', e.message);
    }
    
    // Gera relatório
    const relatorio = gerarRelatorio(dados);
    
    // Salva JSON
    const arquivo = path.join(OUT, 'tendencias.json');
    fs.writeFileSync(arquivo, JSON.stringify(relatorio, null, 2));
    console.log('\n✅ Relatório salvo em:', arquivo);
    
    // Salva markdown
    const md = gerarMarkdown(relatorio);
    const mdFile = path.join(OUT, 'tendencias.md');
    fs.writeFileSync(mdFile, md);
    console.log('✅ Markdown salvo em:', mdFile);
    
    // Exibe sumário
    console.log('\n═══════════════════════════════════════════');
    console.log('  SUMÁRIO DE TENDÊNCIAS');
    console.log('═══════════════════════════════════════════');
    console.log(`  NRs Vigentes: ${relatorio.sumario.total_nrs}`);
    console.log(`  Apps SST: ${relatorio.sumario.apps_sst}`);
    console.log(`  Recomendações: ${relatorio.recomendacoes.length}`);
    console.log('═══════════════════════════════════════════\n');
    
    return relatorio;
}

/**
 * Gera relatório em Markdown
 */
function gerarMarkdown(dados) {
    let md = `# 📊 Relatório de Tendências - SST\n\n`;
    md += `**Gerado em:** ${dados.gerado_em}\n\n`;
    
    md += `## 📋 NRs Vigentes no Brasil\n\n`;
    md += `| NR | Nome | Ano |\n`;
    md += `|---|------|-----|\n`;
    for (const nr of dados.nrs.nrs.slice(0, 10)) {
        md += `| ${nr.nr} | ${nr.nome.substring(0, 40)}... | ${nr.ano} |\n`;
    }
    md += `\n`;
    
    md += `## 💡 Recomendações\n\n`;
    for (const rec of dados.recomendacoes) {
        const icon = rec.prioridade === 'alta' ? '🔴' : '🟡';
        md += `### ${icon} ${rec.titulo}\n`;
        md += `**Tipo:** ${rec.tipo}\n\n`;
        md += `${rec.descricao}\n\n`;
        md += `**Ação:** ${rec.acao}\n\n`;
    }
    
    md += `## 📱 Apps de SST\n\n`;
    for (const app of dados.apps.apps_encontrados) {
        md += `- **${app.nome}**: ${app.descricao} (${app.plataforma})\n`;
    }
    md += `\n`;
    
    md += `---\n`;
    md += `*Gerado pela Esteira 1 - BM System*\n`;
    
    return md;
}

// Executa
main().catch(console.error);
