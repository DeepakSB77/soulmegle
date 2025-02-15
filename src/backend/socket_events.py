from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from extensions import socketio
from flask import request
from database import get_available_users, update_user_availability, update_socket_id


@socketio.on('connect')
def handle_connect():
    try:
        token = request.args.get('token')
        if token:
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            update_socket_id(user_id, request.sid)
            update_user_availability(user_id, True)
            print(f'Client connected. User ID: {user_id}')
        else:
            print('Client connected without authentication')
    except Exception as e:
        print(f'Connection error: {str(e)}')
        return False


@socketio.on('disconnect')
def handle_disconnect():
    try:
        token = request.args.get('token')
        if token:
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            update_user_availability(user_id, False)
    except Exception as e:
        print(f'Disconnect error: {str(e)}')


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
        token = request.args.get('token')
        if not token:
            return

        decoded_token = decode_token(token)
        current_user_id = decoded_token['sub']

        # Find new stranger
        available_users = get_available_users()
        new_stranger = next((user for user in available_users
                             if user.id != current_user_id), None)

        if new_stranger:
            # Create a unique room for these users
            room = f"room_{min(current_user_id, new_stranger.id)}_{max(current_user_id, new_stranger.id)}"
            join_room(room)

            # Notify both users
            emit('new_stranger', {
                'userId': new_stranger.id,
                'username': new_stranger.username,
                'room': room
            }, room=request.sid)

            emit('new_stranger', {
                'userId': current_user_id,
                'room': room
            }, room=new_stranger.socket_id)
        else:
            emit('new_stranger', None, room=request.sid)

    except Exception as e:
        print(f'Skip error: {str(e)}')
        emit('error', {'message': 'Error finding new stranger'},
             room=request.sid)
