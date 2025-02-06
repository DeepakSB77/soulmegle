from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from extensions import socketio


@socketio.on('connect')
def handle_connect():
    try:
        # Get token from request
        token = socketio.request.args.get('token')
        if token:
            # Verify token and get user info
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            print(f'Client connected. User ID: {user_id}')
        else:
            print('Client connected without authentication')
    except Exception as e:
        print(f'Connection error: {str(e)}')
        return False


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


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
