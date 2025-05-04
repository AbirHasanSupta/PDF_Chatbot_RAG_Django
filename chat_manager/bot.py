from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter

import fitz
import os
import uuid

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

    is_new = not os.listdir(db_loc)

    if is_new:
        docs, ids = [], []

        pdfs = bot.pdfs.all()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", ".", " ", ""]
        )

        for pdf_obj in pdfs:
            pdf_path = pdf_obj.file.path
            text = extract_text_from_pdf(pdf_path)

            chunks = text_splitter.split_text(text)

            for chunk in chunks:
                doc = Document(
                    page_content=chunk,
                    metadata={"source": pdf_obj.file.name}
                )
                docs.append(doc)
                ids.append(str(uuid.uuid4()))

        vector_store = Chroma(
            collection_name=f"bot_{bot.id}_docs",
            persist_directory=db_loc,
            embedding_function=embeds
        )
        vector_store.add_documents(documents=docs, ids=ids)

    else:
        vector_store = Chroma(
            collection_name=f"bot_{bot.id}_docs",
            persist_directory=db_loc,
            embedding_function=embeds
        )

    return vector_store


def get_rag_response(question, bot):
    vector_store = setup_vector_store(bot)
    retriever = vector_store.as_retriever(search_kwargs={'k': 3})

    template = """
    You are an expert assistant answering questions using ONLY the provided PDF content.

    Context from uploaded PDFs:
    {reviews}

    Question:
    {question}

    Instructions:
    - If the answer is directly stated in the context, respond accurately.
    - Do not make up answers or provide general knowledge.

    Answer:
    """

    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model

    docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in docs])

    return chain.invoke({"reviews": context, "question": question})
