# Sistema de Processamento de Vendas `.DAT`

## Contexto
A empresa **"Varejo Rápido"** possui um sistema de ponto de venda (PDV) um pouco antigo.  
Diariamente, ao final do expediente, este sistema gera um único arquivo de texto (`.dat`) com todos os registros de vendas do dia.

Este backend foi desenvolvido para **ler, processar e estruturar automaticamente os dados do arquivo `.dat`**, retornando informações detalhadas de vendas, produtos e clientes em JSON.

Ideal para:  
- Transformar arquivos legados em dados estruturados  
- Automatizar relatórios diários de vendas  
- Integração com dashboards ou sistemas ERP modernos

---

## Funcionalidades
- Processamento de arquivos `.dat` do servidor  
- Upload de arquivos via endpoint `/vendas/upload`  
- Retorno de registros estruturados em JSON  
- Cálculo automático de `valor_total_venda`  
- Formatação de datas para padrão ISO (`YYYY-MM-DD`)  
- Tratamento de erros e validação de campos  

---

## Tecnologias Utilizadas
- Node.js + TypeScript  
- Express.js  
- Multer (upload de arquivos)  
- Node FS (leitura de arquivos)  
- Swagger/OpenAPI para documentação da API  

---

## Modelo de Dados

**Venda**  

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_venda | number | Identificador único da venda no sistema |
| data_venda | string | Data da venda (YYYY-MM-DD) |
| quantidade | number | Quantidade de produtos vendidos |
| produto | object | Detalhes do produto |
| produto.id | number | Código do produto |
| produto.nome | string | Nome do produto |
| produto.valor_unitario | number | Valor unitário do produto |
| cliente | object | Detalhes do cliente |
| cliente.id | number | Código do cliente |
| cliente.nome | string | Nome do cliente |
| valor_total_venda | number | Total da venda (quantidade × valor_unitário) |

---

## Rotas da API

### GET `/vendas/processar`
Processa um arquivo de vendas já existente no servidor.  

**Query Params:**  
- `filename` (opcional) → Nome do arquivo `.dat` (padrão: `vendas_29-09-2025.dat`)  

**Resposta 200:**  

```json
{
  "message": "Vendas processadas com sucesso",
  "total": 5,
  "vendas": [
    {
      "id_venda": 1,
      "data_venda": "2025-09-29",
      "quantidade": 2,
      "produto": { "id": 1001, "nome": "Teclado Mecânico Gamer", "valor_unitario": 350.75 },
      "cliente": { "id": 201, "nome": "Ana Silva" },
      "valor_total_venda": 701.50
    }
  ]
}
Resposta 404: Arquivo não encontrado

POST /vendas/upload
Faz upload de um arquivo .dat e processa o conteúdo.

Request Body (multipart/form-data):

file → arquivo .dat

Resposta 200: Array de vendas processadas

Resposta 400: Nenhum arquivo enviado

POST /vendas/processar (alternativa)
Processa um arquivo existente no servidor e retorna JSON estruturado com:

message → Mensagem de sucesso

total → Número total de registros processados

vendas → Array de vendas

Regras de Negócio
Cada linha do .dat corresponde a um registro de venda

Campos numéricos nulos são convertidos para 0

Datas e valores são formatados automaticamente

IDs de clientes e produtos são extraídos corretamente do arquivo

Valores unitários vêm em centavos e são convertidos para reais

Cada venda recebe um id_venda único sequencial

Estrutura de Pastas
/src
  /controller
    VendasController.ts
  /parser
    DatFileParser.ts
  /routes
    vendasRoutes.ts
  server.ts
Como Executar
Instalar dependências do projeto

Compilar TypeScript para JavaScript

Rodar servidor

Acessar endpoints /vendas/processar e /vendas/upload

Exemplo de Payload
Entrada (.dat):

Copiar código
1001Teclado Mecânico Gamer                         0201Ana Silva                 0020000350DDMMYYYY
Saída (JSON):

json
Copiar código
[
  {
    "id_venda": 1,
    "data_venda": "2025-09-29",
    "quantidade": 2,
    "produto": {
      "id": 1001,
      "nome": "Teclado Mecânico Gamer",
      "valor_unitario": 350.75
    },
    "cliente": {
      "id": 201,
      "nome": "Ana Silva"
    },
    "valor_total_venda": 701.50
  }
]
Boas práticas
Validar arquivos .dat antes de enviar

Manter backup dos arquivos originais

Registrar logs de uploads e processamento

Nunca alterar os arquivos originais

Observações
Datas são convertidas para o padrão ISO YYYY-MM-DD

Valores unitários em centavos são convertidos para reais

Todos os registros de venda são retornados mesmo se houver campos incompletos
