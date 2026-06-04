from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url : str
    jwt_secret: str
    jwt_expire_minutes: int = 60 * 24
    class Config:
        env_file = ".env"

settings = Settings()