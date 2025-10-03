Claro! Com base no documento que detalha o desafio "Sistema de Importação e Visualização de Vendas", eu preparei um **Product Requirements Document (PRD - Documento de Requisitos do Produto)**.

Este PRD formaliza o problema, a solução e os requisitos técnicos do desafio de forma estruturada.

---

# Product Requirements Document (PRD)

## **1. Informações Gerais**

| Campo                       | Detalhe                                                                               |
| :-------------------------- | :------------------------------------------------------------------------------------ |
| **Nome do Produto/Projeto** | Sistema de Importação e Visualização de Vendas (Desafio Pulse 2025)                   |
| **Contexto**                | [cite_start]Integração de um sistema legado (PDV) com uma aplicação moderna[cite: 4]. |
| **Cliente**                 | [cite_start]Varejo Rápido - Gerência[cite: 6, 8].                                     |
| **Data de Criação**         | 2 de Outubro de 2025                                                                  |

## **2. Visão Geral e Objetivo**

### **2.1. Problema**

[cite_start]A empresa "Varejo Rápido" utiliza um sistema de Ponto de Venda (PDV) antigo que gera diariamente um único arquivo de texto de largura fixa (.dat) com o resumo de todas as vendas[cite: 6, 7, 21]. [cite_start]A gerência precisa de uma forma **moderna e visual** para acessar essas informações, sem ter que decifrar o arquivo de texto manualmente[cite: 8].

### **2.2. Solução Proposta**

[cite_start]Construir uma solução completa (Leitor Batch, Banco de Dados, API RESTful e Frontend Web) para ler o arquivo `.dat`, armazenar os dados de forma estruturada e exibi-los em uma interface web simples[cite: 9, 11].

### **2.3. Objetivo Principal**

[cite_start]Criar um sistema de ponta a ponta que simule um cenário de desenvolvimento corporativo e permita a visualização de dados de vendas de forma organizada e acessível para a gerência[cite: 4, 9, 8].

## **3. Arquitetura da Solução**

[cite_start]O sistema será composto por 4 partes principais, seguindo o fluxo de dados: `Arquivo .dat -> [Leitor de Arquivo] -> [Banco de Dados] <- [API] <- [Frontend]`[cite: 11, 18].

1.  [cite_start]**Leitor de Arquivo (Processador Batch):** Script ou serviço para ler o arquivo `.dat`, interpretar os dados de largura fixa e inseri-los no banco de dados[cite: 12, 21].
2.  [cite_start]**Banco de Dados:** Armazenamento organizado das informações de vendas, clientes e produtos[cite: 13].
3.  [cite_start]**API RESTful:** Interface entre o banco de dados e o frontend, fornecendo dados padronizados em JSON[cite: 14, 15].
4.  [cite_start]**Frontend:** Aplicação web simples para consumir a API e exibir os dados para o usuário final[cite: 16].

## **4. Requisitos Funcionais Detalhados**

### **4.1. Leitor de Arquivo (Processador Batch)**

| ID       | Requisito                            | Detalhes                                                                                                                                                           |
| :------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF01** | Processamento de Arquivo             | [cite_start]Deve ser capaz de ler um arquivo de texto com o padrão de nome `vendas_dia_AAAA-MM-DD.dat`[cite: 20].                                                  |
| **RF02** | Interpretação de Largura Fixa        | [cite_start]Deve ler cada linha do arquivo, interpretando os campos de acordo com a posição e tamanho fixos estabelecidos[cite: 21].                               |
| **RF03** | Persistência de Vendas               | [cite_start]Deve inserir cada venda processada na tabela `vendas` do banco de dados[cite: 12, 42].                                                                 |
| **RF04** | Inteligência de Importação (Produto) | Antes de registrar uma venda, deve **verificar se o produto já existe** no banco. [cite_start]Se não existir, deve **criá-lo** na tabela `produtos`[cite: 24, 25]. |
| **RF05** | Inteligência de Importação (Cliente) | Antes de registrar uma venda, deve **verificar se o cliente já existe** no banco. [cite_start]Se não existir, deve **criá-lo** na tabela `clientes`[cite: 24, 25]. |

### **4.2. Modelagem e Persistência de Dados**

[cite_start]O sistema deve utilizar um **banco de dados relacional** com 3 tabelas[cite: 27].

#### [cite_start]**Tabela: `produtos`** [cite: 28, 29]

| Coluna           | Tipo           | Chave |
| :--------------- | :------------- | :---- |
| `id`             | INTEGER        | PK    |
| `nome`           | VARCHAR(255)   |       |
| `valor_unitario` | DECIMAL(10, 2) |       |

#### [cite_start]**Tabela: `clientes`** [cite: 30, 35-41]

| Coluna | Tipo         | Chave |
| :----- | :----------- | :---- |
| `id`   | INTEGER      | PK    |
| `nome` | VARCHAR(255) |       |

#### [cite_start]**Tabela: `vendas`** [cite: 42, 43, 44]

| Coluna       | Tipo    | Chave               | Descrição                                                         |
| :----------- | :------ | :------------------ | :---------------------------------------------------------------- |
| `id`         | INTEGER | PK (Auto-Increment) | [cite_start]ID único da transação de venda[cite: 43].             |
| `produto_id` | INTEGER | FK (produtos.id)    | [cite_start]Chave estrangeira para a tabela `produtos`[cite: 43]. |
| `cliente_id` | INTEGER | FK (clientes.id)    | [cite_start]Chave estrangeira para a tabela `clientes`[cite: 44]. |
| `quantidade` | INTEGER |                     | [cite_start]Quantidade de itens vendidos[cite: 44].               |
| `data_venda` | DATE    |                     | [cite_start]Data em que a venda ocorreu[cite: 44].                |

### **4.3. API RESTful**

| ID       | Requisito              | Detalhes                                                                                                      |
| :------- | :--------------------- | :------------------------------------------------------------------------------------------------------------ |
| **RF06** | Endpoint de Vendas     | [cite_start]Criar um endpoint `GET /vendas`[cite: 47].                                                        |
| **RF07** | Retorno de Dados       | [cite_start]O endpoint deve retornar uma lista de **todas as vendas**[cite: 48].                              |
| **RF08** | Combinação de Dados    | [cite_start]A resposta deve combinar informações das 3 tabelas (vendas, clientes, produtos)[cite: 48].        |
| **RF09** | Formato de Resposta    | [cite_start]A resposta deve ser padronizada em formato **JSON**[cite: 49].                                    |
| **RF10** | Cálculo de Valor Total | [cite_start]O objeto de cada venda na resposta JSON deve incluir o campo `"valor_total_venda"`[cite: 68, 82]. |

### **4.4. Frontend Web**

| ID       | Requisito          | Detalhes                                                                                                                                                           |
| :------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF11** | Conexão com API    | [cite_start]Deve consumir o endpoint `GET /vendas` da API[cite: 86].                                                                                               |
| **RF12** | Exibição em Tabela | [cite_start]Deve exibir os dados das vendas em uma interface web limpa e funcional, utilizando uma **tabela**[cite: 85, 86].                                       |
| **RF13** | Colunas da Tabela  | [cite_start]A tabela deve exibir as seguintes colunas: **Data da Venda, Nome do Cliente, Nome do Produto, Quantidade, Valor Unitário, Valor Total**[cite: 87, 88]. |

## **5. Requisitos Opcionais (Bônus)**

| ID       | Requisito                      | Detalhes                                                                                                                                      |
| :------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **RO01** | Funcionalidade de Busca/Filtro | [cite_start]Adicionar um campo de busca/filtro na interface web para filtrar vendas por **nome do cliente** ou **nome do produto**[cite: 89]. |

## **6. Requisitos Técnicos e Tecnologias Sugeridas**

| Componente            | [cite_start]Tecnologias Sugeridas (Livre Escolha) [cite: 91]                         |
| :-------------------- | :----------------------------------------------------------------------------------- |
| **Leitor de Arquivo** | [cite_start]Python, Node.js, Java [cite: 92]                                         |
| **Banco de Dados**    | [cite_start]PostgreSQL, MySQL, SQLite [cite: 93]                                     |
| **API RESTful**       | [cite_start]FastAPI/Flask (Python), Express (Node.js), Spring Boot (Java) [cite: 94] |
| **Frontend**          | [cite_start]React, Vue.js, Angular ou HTML/CSS/JavaScript puros [cite: 95]           |

## **7. Dados de Entrada para Teste**

[cite_start]O sistema deve ser testado com o seguinte arquivo de exemplo[cite: 97, 100]:

**Nome do Arquivo:** `vendas_dia_2025-09-29.dat`

**Estrutura de Linha (Largura Fixa) para cada venda:**

| Campo        | Posição Inicial | Posição Final | Tamanho | Tipo                                      |
| :----------- | :-------------- | :------------ | :------ | :---------------------------------------- |
| ID_PRODUTO   | 1               | 4             | 4       | [cite_start]Numérico [cite: 23]           |
| NOME_PRODUTO | 5               | 54            | 50      | [cite_start]Texto [cite: 23]              |
| ID_CLIENTE   | 55              | 58            | 4       | [cite_start]Numérico [cite: 23]           |
| NOME_CLIENTE | 59              | 108           | 50      | [cite_start]Texto [cite: 23]              |
| QTD_VENDIDA  | 109             | 111           | 3       | [cite_start]Numérico [cite: 23]           |
| VALOR_UNIT   | 112             | 121           | 10      | [cite_start]Numérico (Decimal) [cite: 23] |
| DATA VENDA   | 122             | 131           | 10      | [cite_start]Data (AAAA-MM-DD) [cite: 23]  |
