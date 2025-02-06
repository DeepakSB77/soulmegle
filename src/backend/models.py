from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from pgvector.sqlalchemy import Vector
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'  # Explicitly set table name

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    interests = db.Column(db.Text, nullable=True)
    answers = db.Column(db.JSON, nullable=True)
    embedding = db.Column(Vector(1536), nullable=True)
    is_online = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
