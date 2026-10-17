/**
 * 6_melhorar_modulo_criado
 * Melhora qualquer modulo
 */

const MODULO = process.argv[2] || "treinamentos";

async function perceber() {
    console.log("[PERCEBER] Modulo: " + MODULO);
}

async function pensar() {
    console.log("[PENSAR] Analisando...");
}

async function agir() {
    console.log("[AGIR] Melhorando...");
}

async function repetir() {
    console.log("[REPETIR] Concluido!");
}

async function main() {
    try {
        await perceber();
        await pensar();
        await agir();
        await repetir();
    } catch(e) {
        console.error(e);
    }
}

main();
