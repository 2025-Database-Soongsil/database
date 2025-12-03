import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import TextLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter

load_dotenv()

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "pregnancy_guide.txt"


class ChatbotInitError(RuntimeError):
    """Raised when the chatbot cannot be prepared (missing env or data)."""


class LiteRetriever:
    """Minimal retriever that keeps embeddings in memory for fast lookups."""

    def __init__(self, documents, embedding_model):
        self.documents = documents
        self.embedding_model = embedding_model
        texts = [d.page_content for d in documents]
        self.doc_vectors = embedding_model.embed_documents(texts)

    def similarity_search(self, query: str, k: int = 3):
        query_vec = self.embedding_model.embed_query(query)
        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            score = sum(q * d for q, d in zip(query_vec, doc_vec))
            scores.append((score, self.documents[i]))
        scores.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scores[:k]]

    def as_retriever(self):
        return RunnableLambda(lambda x: self.similarity_search(x["input"] if isinstance(x, dict) else x))


class ChatbotEngine:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ChatbotInitError("OPENAI_API_KEY가 설정되어 있지 않습니다.")
        if not DATA_PATH.exists():
            raise ChatbotInitError(f"가이드 문서를 찾을 수 없습니다: {DATA_PATH}")

        loader = TextLoader(str(DATA_PATH), encoding="utf-8")
        docs = loader.load()
        text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)

        proxy_keys = [
            "HTTP_PROXY",
            "HTTPS_PROXY",
            "ALL_PROXY",
            "NO_PROXY",
            "http_proxy",
            "https_proxy",
            "all_proxy",
            "no_proxy",
        ]
        removed_proxies = {k: os.environ.pop(k) for k in proxy_keys if k in os.environ}
        # 일부 구버전 openai 패키지에서 proxies 파라미터를 받지 못해 에러가 나므로 임시로 비활성화
        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            retriever = LiteRetriever(splits, embeddings).as_retriever()
            llm = ChatOpenAI(model="gpt-4o")
        finally:
            os.environ.update(removed_proxies)

        system_prompt = (
            "당신은 난임 및 임신 준비 여성을 돕는 따뜻하고 사려 깊은 'AI 코디네이터'입니다. "
            "사용자의 질문을 분석하여 아래 **우선순위 지침**에 따라 답변하세요.\n\n"
            "**[제1원칙: 의료 안전]**\n"
            "사용자의 질문에서 '통증', '출혈', '고열', '복통', '심각한 부작용' 등 의학적 위급상황이나 "
            "개인적인 진단(예: '이거 유산인가요?', '이 약 먹어도 될까요?')을 요구하는 뉘앙스가 느껴진다면, "
            "어떤 정보도 주지 말고 **'저는 의사가 아니기 때문에 정확한 진단을 위해 꼭 병원에 방문하셔서 전문의와 상담해보시길 권해드려요.'**라고 정중하게 안내하세요.\n\n"
            "**[제2원칙: 임신/영양제 정보]**\n"
            "제1원칙에 해당하지 않는 임신, 영양제, 시술 관련 정보성 질문은 "
            "반드시 아래 제공된 **[문맥]**에 있는 내용을 바탕으로 답변하세요. "
            "[문맥]에 없는 내용은 지어내지 말고 솔직하게 모른다고 답하세요.\n\n"
            "**[제3원칙: 일상 대화]**\n"
            "임신과 관련 없는 일상적인 주제(인사, 날씨, 메뉴 추천, 위로 등)는 "
            "당신의 일반적인 지식을 활용하여 친구처럼 자유롭고 친절하게 대화하세요.\n\n"
            "**[말투 가이드]**\n"
            "- 항상 사용자의 힘든 마음에 공감하는 따뜻하고 부드러운 '해요'체를 사용하세요.\n"
            "- 딱딱한 설명보다는 옆에서 챙겨주는 언니나 친구 같은 느낌을 주세요.\n"
            "- 가독성을 위해 문장이 끝날 때마다 줄바꿈을 해주세요.\n\n"
            "[문맥]:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", "{input}"),
            ]
        )

        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        self.rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    def ask(self, message: str) -> str:
        result = self.rag_chain.invoke({"input": message})
        return result.get("answer", "답변을 생성하지 못했습니다.")

    async def aask(self, message: str) -> str:
        result = await self.rag_chain.ainvoke({"input": message})
        return result.get("answer", "답변을 생성하지 못했습니다.")


@lru_cache(maxsize=1)
def get_chatbot_engine() -> ChatbotEngine:
    return ChatbotEngine()
