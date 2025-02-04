from flask import request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from models import User, db
import requests
import os
from flask_socketio import SocketIO

jwt = JWTManager(app)
socketio = SocketIO(app)


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    new_user = User(username=data['username'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Bad username or password"}), 401


@app.route('/process_audio', methods=['POST'])
def process_audio():
    audio_file = request.files['file']
    # Send to OpenAI API for processing
    response = requests.post('https://api.openai.com/v1/audio/transcriptions', headers={
        'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}',
    }, files={'file': audio_file})

    if response.status_code == 200:
        return jsonify(response.json()), 200
    else:
        return jsonify({"error": "Failed to process audio"}), response.status_code


@app.route('/generate_embedding', methods=['POST'])
def generate_embedding():
    data = request.get_json()
    # Call OpenAI API to generate embeddings
    response = requests.post('https://api.openai.com/v1/embeddings', headers={
        'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}',
    }, json={"input": data['text'], "model": "text-embedding-ada-002"})

    if response.status_code == 200:
        embedding = response.json()['data'][0]['embedding']
        # Store in database
        user = User.query.get(data['user_id'])
        user.embedding = embedding
        db.session.commit()
        return jsonify({"msg": "Embedding generated and stored"}), 200
    else:
        return jsonify({"error": "Failed to generate embedding"}), response.status_code


@socketio.on('message')
def handle_message(msg):
    # Broadcast the message to all connected clients
    socketio.send(msg)


@socketio.on('connect')
def handle_connect():
    print("Client connected")


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")
