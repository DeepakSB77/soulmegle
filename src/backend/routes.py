from flask import request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from services.ai_service import transcribe_audio, get_embedding, calculate_similarity
from models import User, db
import requests
import os
from flask_socketio import SocketIO, emit
from app import app
import numpy as np

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


@app.route('/process_answers', methods=['POST'])
@jwt_required()
def process_answers():
    current_user_id = get_jwt_identity()
    audio_files = request.files.getlist('audio_files')

    # Process all audio answers
    transcribed_text = []
    for audio in audio_files:
        text = transcribe_audio(audio)
        if text:
            transcribed_text.append(text)

    # Combine all answers into one text
    combined_text = " ".join(transcribed_text)

    # Generate embedding
    embedding = get_embedding(combined_text)
    if not embedding:
        return jsonify({"error": "Failed to generate embedding"}), 500

    # Update user's embedding
    user = User.query.get(current_user_id)
    user.interests = combined_text
    user.embedding = embedding
    db.session.commit()

    return jsonify({"message": "Answers processed successfully"}), 200


@app.route('/find_match', methods=['GET'])
@jwt_required()
def find_match():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    # Find most similar user
    threshold = 0.7  # Minimum similarity threshold

    # PostgreSQL query using pgvector
    similar_user = User.query.filter(
        User.id != current_user_id,
        User.embedding.cosine_distance(current_user.embedding) <= threshold
    ).order_by(User.embedding.cosine_distance(current_user.embedding)).first()

    if similar_user:
        return jsonify({
            "match_found": True,
            "user_id": similar_user.id,
            "similarity": calculate_similarity(current_user.embedding, similar_user.embedding)
        }), 200

    return jsonify({"match_found": False}), 200


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


@socketio.on('join_room')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('user_joined', {'user_id': request.sid}, room=room)


@socketio.on('offer')
def on_offer(data):
    emit('offer', data, room=data['target'])


@socketio.on('answer')
def on_answer(data):
    emit('answer', data, room=data['target'])


@socketio.on('ice_candidate')
def on_ice_candidate(data):
    emit('ice_candidate', data, room=data['target'])
