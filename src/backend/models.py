from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from pgvector.sqlalchemy import Vector


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    interests = db.Column(db.Text)
    embedding = db.Column(Vector(1536))  # OpenAI embedding dimension

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
