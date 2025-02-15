from extensions import db
from models import User, Message, MatchingAnswer, ActiveSession
from sqlalchemy import and_


def create_user(username, password_hash):
    user = User(username=username, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return user


def get_user_by_id(user_id):
    return User.query.get(user_id)


def store_matching_answers(user_id, answers):
    for idx, answer in enumerate(answers):
        answer_record = MatchingAnswer(
            user_id=user_id,
            question_number=idx + 1,
            answer_url=answer
        )
        db.session.add(answer_record)
    db.session.commit()


def create_chat_session(user1_id, user2_id, room_id):
    session1 = ActiveSession(user_id=user1_id, room_id=room_id)
    session2 = ActiveSession(user_id=user2_id, room_id=room_id)
    db.session.add_all([session1, session2])
    db.session.commit()


def store_message(sender_id, receiver_id, text, room_id):
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        text=text,
        room_id=room_id
    )
    db.session.add(message)
    db.session.commit()
    return message
