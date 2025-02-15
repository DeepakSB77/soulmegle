from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from pgvector.sqlalchemy import Vector
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'  # Explicitly set table name

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    interests = db.Column(db.Text, nullable=True)
    answers = db.Column(db.JSON, nullable=True)
    embedding = db.Column(Vector(1536), nullable=True)
    is_online = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_available = db.Column(db.Boolean, default=True)
    socket_id = db.Column(db.String(120))
    role = db.Column(db.String(20), default='user')
    name = db.Column(db.String(100))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_available': self.is_available
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    room_id = db.Column(db.String(100))


class MatchingAnswer(db.Model):
    __tablename__ = 'matching_answers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    question_number = db.Column(db.Integer)
    answer_url = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class ActiveSession(db.Model):
    __tablename__ = 'active_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    room_id = db.Column(db.String(100))
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
