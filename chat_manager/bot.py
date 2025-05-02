from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

import fitz
import os

model = OllamaLLM(model='llama3.2:latest')
embeds = OllamaEmbeddings(model="mxbai-embed-large")

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text("text") + "\n\n"
    return text

def setup_vector_store(bot):
    db_loc = f"./chroma_dbs/bot_{bot.id}"
    os.makedirs(db_loc, exist_ok=True)

    vector_store = Chroma(
        collection_name=f"bot_{bot.id}_docs",
        persist_directory=db_loc,
        embedding_function=embeds
    )


    if not os.listdir(db_loc):
        docs, ids = [], []
        pdfs = bot.pdfs.all()

        for i, pdf_obj in enumerate(pdfs):
            pdf_path = pdf_obj.file.path
            text = extract_text_from_pdf(pdf_path)
            doc = Document(
                page_content=text,
                metadata={"source": pdf_obj.file.name},
                id=str(i)
            )
            docs.append(doc)
            ids.append(str(i))

        vector_store.add_documents(documents=docs, ids=ids)

    return vector_store

def get_rag_response(question, bot):
    vector_store = setup_vector_store(bot)
    retriever = vector_store.as_retriever(search_kwargs={'k': 3})

    template = """
        You are an expert in answering questions from the uploaded PDF documents.

        Here is some extracted content: {reviews}

        Please answer the question: {question}
    """
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model

    docs = retriever.invoke(question)
    return chain.invoke({"reviews": docs, "question": question})
