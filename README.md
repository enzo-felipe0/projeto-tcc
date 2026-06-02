# Benchmark de IA no Navegador: CPU vs GPU (WebGL & WebGPU) 🚀
> **Projeto de Trabalho de Conclusão de Curso (TCC)**

Este repositório contém o código-fonte de um projeto experimental de TCC desenvolvido para **comparar o desempenho de modelos de Inteligência Artificial (Deep Learning) executados diretamente no navegador do usuário (client-side)**, avaliando diferentes motores de processamento (CPU vs. GPU via WebGL e WebGPU) e registrando métricas de tempo de inferência em um banco de dados persistente.

---

## 🎯 Objetivo do Projeto

Tradicionalmente, a inferência de modelos de Deep Learning pesados ocorre no lado do servidor (*backend*): o cliente envia uma imagem ou dado, o servidor processa (muitas vezes utilizando GPUs caras em nuvem) e retorna o resultado. 

Este projeto investiga a viabilidade de **descentralizar esse processamento**, executando o modelo diretamente no hardware do próprio cliente através de tecnologias web modernas. O foco principal é avaliar e comparar o desempenho (medido em tempo de inferência em milissegundos) entre:
*   **CPU:** Processamento padrão feito de forma sequencial ou multithread clássica no processador.
*   **WebGL:** Aceleração gráfica convencional usando APIs de renderização padrão suportadas na maioria dos navegadores.
*   **WebGPU:** A nova API de gráficos e computação para a web, oferecendo acesso de baixo nível muito mais eficiente às GPUs modernas.

---

## 🏗️ Arquitetura do Sistema

O sistema é dividido em duas partes fundamentais: um **Frontend** interativo que realiza a inferência em tempo de execução local, e um **Backend** leve para persistência e catalogação de dados dos testes realizados.

```mermaid
graph TD
    A[Usuário] -->|Upload de Imagem & Seleção de Motor| B(Frontend - index.html)
    B -->|Inicializa TensorFlow.js & MobileNet| C{Motor Selecionado}
    C -->|Processa na CPU| D[CPU]
    C -->|Aceleração WebGL| E[WebGL GPU]
    C -->|Aceleração de Baixo Nível| F[WebGPU GPU]
    D --> G[Mapeia Tempo de Inferência]
    E --> G
    F --> G
    G -->|Envia HTTP POST /main/dados| H(Backend - Node.js + Express)
    H -->|Registra Benchmark| I[(SQLite - db.sqlite)]
```

---

## 💻 Frontend (Cliente)

Localizado no diretório `/frontend`, o frontend consiste em uma aplicação de página única (*Single Page Application* - SPA) construída com tecnologias web nativas para garantir o mínimo de overhead no benchmark.

### Componentes Principais
*   **TensorFlow.js (tfjs):** Framework principal responsável por carregar o modelo e orquestrar os tensores e tensores de computação gráfica.
*   **TensorFlow.js WebGPU Backend:** Driver de execução experimental que mapeia as operações matemáticas do modelo diretamente na API WebGPU nativa do navegador.
*   **MobileNet v2:** Modelo de rede neural convolucional (CNN) pré-treinado carregado dinamicamente para classificação de imagens de propósito geral (1000 categorias).
*   **Coletor de Especificações de Hardware & Software:** Script utilitário em JavaScript que detecta automaticamente detalhes do ambiente cliente (SO, Navegador, Placa de Vídeo/GPU via WebGL, Núcleos de CPU e RAM instalada).

### Fluxo de Trabalho
1.  O usuário carrega uma imagem (`png` ou `jpeg`).
2.  Seleciona o motor de inferência desejado (`cpu`, `webgl` ou `webgpu`).
3.  O frontend reconfigura o backend do TF.js em tempo real através de `tf.setBackend()` e aguarda sua inicialização via `tf.ready()`.
4.  O cronômetro de precisão (`performance.now()`) é acionado antes e após a chamada de `model.classify(image)`.
5.  Os resultados da classificação e o tempo de processamento são apresentados na tela.
6.  As especificações de hardware (CPU, RAM, GPU) e do sistema (SO, Navegador) do usuário são capturadas de forma automática.
7.  Os dados do benchmark e metadados do ambiente do usuário são transmitidos via `fetch` para o backend para análise posterior.

---

## 🎛️ Backend (Servidor de Métricas)

Localizado no diretório `/backend`, o backend foi estruturado em Node.js utilizando o padrão de arquitetura MVC simples (Model-View-Controller) para receber e organizar as estatísticas de desempenho coletadas pelos usuários.

### Tecnologias Utilizadas
*   **Node.js & Express.js:** Criação do servidor HTTP e rotas de API REST de alta performance.
*   **SQLite3:** Banco de dados relacional leve e local que armazena os registros em arquivo físico local (`db.sqlite`) sem necessidade de configurar instâncias pesadas de banco de dados.
*   **CORS:** Habilitado para permitir comunicações seguras entre a origem do frontend e a porta do backend.

### Estrutura do Banco de Dados
A tabela `benchmarks` é criada automaticamente ao iniciar o backend e possui a seguinte estrutura (as colunas de hardware e software são adicionadas dinamicamente via rotina de migração automática ao ligar o servidor, garantindo a compatibilidade retroativa):

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Chave primária auto-incrementada. |
| `motor` | `TEXT` | O motor utilizado no teste (`cpu`, `webgl` ou `webgpu`). |
| `tempo` | `REAL` | Tempo de inferência registrado em milissegundos. |
| `resultados` | `TEXT` | String JSON contendo os maiores índices de predição do modelo MobileNet. |
| `criado_em` | `DATETIME` | Registro de data/hora da inferência (padrão `CURRENT_TIMESTAMP`). |
| `so` | `TEXT` | O Sistema Operacional detectado do usuário (ex: `Windows`, `Linux`, `macOS`, etc.). |
| `navegador` | `TEXT` | O Navegador utilizado (ex: `Chrome`, `Firefox`, `Edge`, etc.). |
| `ram` | `TEXT` | Capacidade estimada de memória RAM do dispositivo (ex: `8 GB`). |
| `cpu_cores` | `TEXT` | Número de processadores/threads lógicas do cliente (ex: `16`). |
| `gpu` | `TEXT` | O modelo e fabricante da placa de vídeo detectado via driver gráfico WebGL (ex: `NVIDIA GeForce RTX 3070`). |

### Rotas Disponíveis (`/main`)
*   `POST /main/dados`: Valida e insere um novo registro de benchmark no SQLite.
*   `GET /main/dados`: Recupera todos os benchmarks do banco ordenados cronologicamente (do mais recente ao mais antigo) para uso em análises estatísticas ou gráficos futuros.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
*   **Node.js** (versão 16 ou superior recomendada)
*   Um navegador moderno compatível com **WebGPU** (Chrome 113+, Edge 113+, Opera) ou **WebGL** para testes acelerados por GPU.

### Passo 1: Configurar e Rodar o Backend

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor em modo de desenvolvimento (usa nodemon para autoreload):
   ```bash
   npm run dev
   ```
   O console exibirá: `Servidor HTTP rodando na porta 3335` e `Conectado ao banco de dados SQLite com sucesso.`

### Passo 2: Executar o Frontend

Como o frontend é puramente estático (`index.html`), você pode:
*   Abrir o arquivo `frontend/index.html` diretamente em seu navegador dando um duplo clique. 
Não é recomendado usar a extensão Live Server devido ao fato do sqlite atualizar e fazer com que a página dê hot reload.