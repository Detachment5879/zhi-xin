from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str

    # LLM
    llm_provider: str = "deepseek"
    llm_model: str = "deepseek-chat"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"

    # 知薪
    pass_threshold: float = 0.80
    max_cycles: int = 2
    review_pass_threshold: float = 0.67

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
