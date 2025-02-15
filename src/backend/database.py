from models import User
from extensions import db


def get_available_users():
    return User.query.filter_by(is_available=True).all()


def update_user_availability(user_id, is_available):
    user = User.query.get(user_id)
    if user:
        user.is_available = is_available
        db.session.commit()
        return True
    return False


def update_socket_id(user_id, socket_id):
    user = User.query.get(user_id)
    if user:
        user.socket_id = socket_id
        db.session.commit()
        return True
    return False
