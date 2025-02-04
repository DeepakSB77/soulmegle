import os


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL')  # PostgreSQL connection string
    SQLALCHEMY_TRACK_MODIFICATIONS = False
