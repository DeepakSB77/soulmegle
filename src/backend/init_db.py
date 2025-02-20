from app import app, db
from models import User
from services.vector_services import initialize_pinecone


def init_db():
    with app.app_context():
        # Drop all existing tables
        db.drop_all()

        # Create tables
        db.create_all()

        # Enable pgvector extension
        db.session.execute('CREATE EXTENSION IF NOT EXISTS vector')
        db.session.commit()

        print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()
