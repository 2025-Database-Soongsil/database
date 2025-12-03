import os
import math
from typing import List
from dotenv import load_dotenv

# LangChain 및 OpenAI 도구들
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnableLambda

# 1. API 키 확인
load_dotenv()
if not os.getenv("OPENAI_API_KEY"):
    print("❌ 오류: .env 파일에 OPENAI_API_KEY가 없습니다.")
    exit()

print(">>> [시스템] OpenAI 챗봇 시동 중... (Custom Lite Ver.)")

# 2. 데이터 불러오기
try:
    loader = TextLoader("./data/pregnancy_guide.txt", encoding="utf-8")
    docs = loader.load()
except Exception as e:
    print("❌ ./data/pregnancy_guide.txt 파일을 찾을 수 없습니다.")
    exit()

# 3. 텍스트 쪼개기
text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
splits = text_splitter.split_documents(docs)

# 4. [핵심] 직접 만든 간이 검색기 (LiteRetriever)
# 라이브러리 버전에 상관없이 작동하도록 직접 구현했습니다.
class LiteRetriever:
    def __init__(self, documents, embedding_model):
        self.documents = documents
        self.embedding_model = embedding_model
        print(">>> 데이터 학습 중... (단순 계산)")
        # 미리 텍스트들을 벡터(숫자)로 변환해둡니다.
        texts = [d.page_content for d in documents]
        self.doc_vectors = embedding_model.embed_documents(texts)

    def similarity_search(self, query: str, k: int = 3):
        # 질문을 벡터로 변환
        query_vec = self.embedding_model.embed_query(query)
        
        # 모든 문서와 유사도 비교 (코사인 유사도 계산)
        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            # 내적(Dot Product) 계산
            score = sum(q * d for q, d in zip(query_vec, doc_vec))
            scores.append((score, self.documents[i]))
        
        # 점수가 높은 순으로 정렬해서 k개 반환
        scores.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scores[:k]]

    def as_retriever(self):
        # 랭체인 체인에 연결하기 위한 껍데기 함수
        return RunnableLambda(lambda x: self.similarity_search(x["input"] if isinstance(x, dict) else x))

# 임베딩 모델 준비
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 내수용 검색기 생성 (여기서 에러가 안 납니다)
custom_retriever = LiteRetriever(splits, embeddings).as_retriever()

# 5. 챗봇 모델 설정
llm = ChatOpenAI(model="gpt-4o")

# 6. 프롬프트 및 체인 연결
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
    "- 딱딱한 설명보다는 옆에서 챙겨주는 언니나 친구 같은 느낌을 주세요.\n\n"
    
    "[문맥]:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(custom_retriever, question_answer_chain)

# 7. 실행
print("\n" + "="*40)
print("✅ 챗봇 준비 완료 (종료: exit)")
print("="*40)

while True:
    user_input = input("\n👤 질문: ")
    if user_input.lower() in ["exit", "종료"]:
        break
    
    try:
        response = rag_chain.invoke({"input": user_input})
        print(f"🤖 답변: {response['answer']}")
    except Exception as e:
        print(f"❌ 에러 발생: {e}")