from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from extensions import socketio, db
from flask import request
from database import get_available_users, update_user_availability, update_socket_id
from models import User


@socketio.on('connect')
def handle_connect():
    try:
        token = request.args.get('token')
        if token:
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']

            # Update user status
            user = User.query.get(user_id)
            if user:
                user.is_online = True
                user.socket_id = request.sid
                db.session.commit()

            print(f'User {user_id} connected with socket ID: {request.sid}')
        else:
            print('Client connected without authentication')
    except Exception as e:
        print(f'Connection error: {str(e)}')
        return False


@socketio.on('disconnect')
def handle_disconnect():
    try:
        # Find user by socket_id and update status
        user = User.query.filter_by(socket_id=request.sid).first()
        if user:
            user.is_online = False
            user.socket_id = None
            db.session.commit()
            print(f'User {user.id} disconnected')
    except Exception as e:
        print(f'Disconnection error: {str(e)}')


@socketio.on('message')
def handle_message(message):
    print(f'Received message: {message}')
    # Broadcast the message to all connected clients
    emit('message', message, broadcast=True)


@socketio.on('join_room')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('message', f'User has joined the room {room}', room=room)


@socketio.on('leave_room')
def on_leave(data):
    room = data['room']
    leave_room(room)
    emit('message', f'User has left the room {room}', room=room)


@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, room=data['target'])


@socketio.on('answer')
def handle_answer(data):
    emit('answer', data, room=data['target'])


@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    emit('ice_candidate', data, room=data['target'])


@socketio.on('skip')
def handle_skip():
    try:
        # Get current user
        token = request.args.get('token')
        if token:
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']

            # Get user's current room
            user = User.query.get(user_id)
            if user and user.socket_id:
                # Notify other user in the room
                emit('partner_skipped', room=user.socket_id)

                # Reset user's room
                user.is_available = True
                db.session.commit()

    except Exception as e:
        print(f'Skip error: {str(e)}')


@socketio.on('find_stranger')
def handle_find_stranger():
    try:
        token = request.args.get('token')
        if token:
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']

            # Find available user
            available_user = User.query.filter(
                User.id != user_id,
                User.is_online == True,
                User.is_available == True
            ).first()

            if available_user:
                # Create new room
                room_id = f"room_{user_id}_{available_user.id}"

                # Update both users
                current_user = User.query.get(user_id)
                if current_user:
                    current_user.is_available = False
                available_user.is_available = False
                db.session.commit()

                # Notify both users
                emit('new_stranger', {
                    'room': room_id,
                    'userId': available_user.id
                }, room=current_user.socket_id)

                emit('new_stranger', {
                    'room': room_id,
                    'userId': user_id
                }, room=available_user.socket_id)
            else:
                emit('no_stranger_available', room=request.sid)

    except Exception as e:
        print(f'Find stranger error: {str(e)}')
