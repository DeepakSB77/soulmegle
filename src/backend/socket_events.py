from flask_socketio import emit, join_room, leave_room
from extensions import socketio


@socketio.on('connect')
def handle_connect():
    print('Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('join_room')
def handle_join_room(data):
    room = data['room']
    join_room(room)
    emit('user_joined', {'user': data['user']}, room=room)


@socketio.on('leave_room')
def handle_leave_room(data):
    room = data['room']
    leave_room(room)
    emit('user_left', {'user': data['user']}, room=room)


@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, room=data['target'])


@socketio.on('answer')
def handle_answer(data):
    emit('answer', data, room=data['target'])


@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    emit('ice_candidate', data, room=data['target'])
