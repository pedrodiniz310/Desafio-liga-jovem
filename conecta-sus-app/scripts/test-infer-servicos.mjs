// Testes da heuristica de inferencia de servico CNES (honestidade: nunca privado).
// Roda sem rede/banco:  node --test scripts/test-infer-servicos.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { inferServicos } from "./import-cnes.mjs";

// Monta um estabelecimento normalizado minimo para a heuristica.
function estab({ tipo = "", nome = "", razao = "", natureza = "", codigoTipo = 0 } = {}) {
  return {
    tipo,
    nome,
    nome_fantasia: nome,
    _codigoTipoUnidade: codigoTipo,
    _raw: {
      nome_razao_social: razao,
      descricao_natureza_juridica_estabelecimento: natureza,
    },
  };
}

test("UBS publica -> atencao_basica + vacina + prenatal", () => {
  const s = inferServicos(
    estab({ tipo: "CENTRO DE SAUDE/UNIDADE BASICA", nome: "UBS CENTRO", natureza: "1244" }),
  );
  assert.ok(s.includes("atencao_basica"));
  assert.ok(s.includes("vacina"));
  assert.ok(s.includes("prenatal"));
});

test("CAPS -> saude_mental (CAPS e publico por natureza)", () => {
  const s = inferServicos(estab({ tipo: "CENTRO DE ATENCAO PSICOSSOCIAL", nome: "CAPS II" }));
  assert.ok(s.includes("saude_mental"));
});

test("CEO publico (natureza 1xxx) -> odonto_esp", () => {
  const s = inferServicos(
    estab({ nome: "CEO CENTRO DE ESPECIALIDADES ODONTOLOGICAS", natureza: "1244" }),
  );
  assert.ok(s.includes("odonto_esp"));
});

test("CER publico (natureza 1xxx) -> reabilitacao", () => {
  const s = inferServicos(
    estab({ nome: "CER CENTRO ESPECIALIZADO EM REABILITACAO", natureza: "1147" }),
  );
  assert.ok(s.includes("reabilitacao"));
});

// --- O furo que a code review encontrou: nome com "SUS"/privado nao pode passar ---

test("clinica de fisioterapia PRIVADA (2xxx) NAO entra em reabilitacao", () => {
  const s = inferServicos(estab({ nome: "BELLA FISIO REABILITACAO PILATES", natureza: "2062" }));
  assert.equal(s.includes("reabilitacao"), false);
});

test("clinica privada com 'SUS' no nome NAO passa o gate (furo do nomePublico)", () => {
  const s = inferServicos(estab({ nome: "CLINICA ODONTO CREDENCIADA SUS LTDA", natureza: "2240" }));
  assert.equal(s.includes("odonto_esp"), false);
});

test("drogaria privada chamada 'farmacia' (tipo nao-43) NAO vira farmacia gratuita", () => {
  const s = inferServicos(estab({ nome: "FARMACIA SAO JOAO", natureza: "2062", codigoTipo: 99 }));
  assert.equal(s.includes("farmacia"), false);
});

test("natureza ausente -> tratado como privado (fail-closed)", () => {
  const s = inferServicos(estab({ nome: "CONSULTORIO ODONTOLOGICO ISOLADO", natureza: "" }));
  assert.equal(s.includes("odonto_esp"), false);
});

test("farmacia por TIPO oficial (codigo 43) continua valendo", () => {
  const s = inferServicos(estab({ tipo: "FARMACIA", nome: "FARMACIA BASICA MUNICIPAL", natureza: "1244", codigoTipo: 43 }));
  assert.ok(s.includes("farmacia"));
});
