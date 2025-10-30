"""博客文章模型"""
from sqlalchemy import Column, Integer, Text, DateTime
from datetime import datetime
from ..database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    images = Column(Text)  # JSON字符串存储图片列表
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

