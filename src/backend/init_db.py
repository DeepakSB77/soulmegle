from app import app, db
from models import User


def init_db():
    with app.app_context():
        # Create tables
        db.create_all()

        # Enable pgvector extension
        db.session.execute('CREATE EXTENSION IF NOT EXISTS vector')
        db.session.commit()

        print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()
