# RAG\_WEB\_DJANGO

RAG\_WEB\_DJANGO is a Django-based web application that allows users to upload PDFs and interact with a chatbot that provides answers grounded only in the uploaded document's content. The system uses **Retrieval-Augmented Generation (RAG)** with **LangChain**, **Chroma** for vector storage, and **Ollama** to run local LLMs and embedding models.

Each bot created in the system has its own isolated vector store, ensuring that document data is not shared across bots.

---

## How it works

```
PDF ➜ Extracted with PyMuPDF ➜ Text split using RecursiveCharacterTextSplitter
    ➜ Embedded with mxbai-embed-large ➜ Stored in a Chroma vector DB
    ➜ On user query ➜ Retrieve top 3 relevant chunks ➜ Query llama3.2 model with context
```

* Text chunks are generated with \~800 token size and 100 token overlap.
* The vector DB is stored locally per bot: `./chroma_dbs/bot_<id>`.
* Ollama runs both the embedding and LLM models locally.

---

## Prerequisites

* Python 3.10 or higher
* [Ollama](https://ollama.com/download) installed and running
* Git (to clone the repository)

---

## Installation

```bash
# Clone the repository
$ git clone https://github.com/AbirHasanSupta/RAG_WEB_DJANGO.git
$ cd RAG_WEB_DJANGO

# Create and activate a virtual environment
$ python -m venv .venv
$ source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
$ pip install --upgrade pip
$ pip install -r requirements.txt
```

### Additional libraries to include in `requirements.txt`

Ensure the following are added to `requirements.txt`:

```
langchain>=0.1.19
langchain-core>=0.1.48
langchain-ollama>=0.0.7
langchain-chroma>=0.0.7
chromadb>=0.4.24
PyMuPDF>=1.25.2
django>=4.2
```

---

## Setting up Ollama

1. Install Ollama from [https://ollama.com/download](https://ollama.com/download)
2. Pull the required models:

```bash
ollama pull llama3.2:latest         # Main LLM
ollama pull mxbai-embed-large       # Embedding model
```

3. Start the Ollama server:

```bash
ollama serve
```

This must remain running. The Django app sends all requests to the Ollama API at `http://localhost:11434`.

---

## Environment variables

Create a `.env` file in the project root with the following content:

```ini
SECRET_KEY=your-django-secret-key
DEBUG=True

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_LLM_MODEL=llama3.2:latest
OLLAMA_EMBED_MODEL=mxbai-embed-large
CHROMA_DB_DIR=./chroma_dbs
```

---

## Running the application

```bash
# Apply migrations
$ python manage.py migrate

# Create a superuser if needed
$ python manage.py createsuperuser

# Run the development server
$ python manage.py runserver
```

Access the application at `http://127.0.0.1:8000/`.

---

## Bot Logic Overview

When a user creates a bot and uploads a PDF:

1. The PDF is parsed using PyMuPDF (`fitz`).
2. Text is chunked using LangChain’s `RecursiveCharacterTextSplitter`.
3. Chunks are embedded using Ollama’s `mxbai-embed-large` model.
4. Embeddings are stored in a Chroma vector DB in a folder specific to the bot.
5. When a user asks a question, the top 3 relevant chunks are retrieved.
6. A prompt is constructed with context and sent to `llama3.2` via Ollama.
7. The response is returned to the user.

This ensures answers are only based on the uploaded PDF, without relying on external knowledge.

---

## Troubleshooting

| Issue                          | Solution                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| ConnectionError / ECONNREFUSED | Ensure `ollama serve` is running                                  |
| Model not found                | Make sure you've pulled `llama3.2:latest` and `mxbai-embed-large` |
| High memory usage              | Use a smaller model (e.g. `llama3.8b`)                            |
| Corrupted vector DB            | Delete `./chroma_dbs/bot_<id>` and re-ask your question           |

---

