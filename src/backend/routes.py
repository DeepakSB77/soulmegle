from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from services.ai_service import transcribe_audio, get_embedding, calculate_similarity
from models import User
from extensions import db
import traceback
import os

# Create a Blueprint
routes_bp = Blueprint('routes', __name__)


@routes_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate input
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"msg": "Missing username or password"}), 400

        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"msg": "Username already exists"}), 400

        # Create new user
        new_user = User(username=data['username'])
        new_user.set_password(data['password'])

        # Add to database
        db.session.add(new_user)
        db.session.commit()

        # Generate access token
        access_token = create_access_token(identity=new_user.id)

        return jsonify({
            "msg": "User registered successfully",
            "access_token": access_token
        }), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"msg": "Registration failed", "error": str(e)}), 500


@routes_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Bad username or password"}), 401


@routes_bp.route('/process_audio', methods=['POST'])
@jwt_required()
def process_audio():
    try:
        audio_file = request.files['file']
        if not audio_file:
            return jsonify({"msg": "No audio file provided"}), 400

        audio_path = os.path.join('temp', audio_file.filename)
        audio_file.save(audio_path)

        # Process the audio file (e.g., transcribe it)
        # Here you would call your OpenAI API or any other processing logic
        # For example:
        # response = openai.Audio.transcribe("whisper-1", audio_path)

        # Clean up the temporary file
        os.remove(audio_path)

        return jsonify({"msg": "Audio processed successfully"}), 200

    except Exception as e:
        return jsonify({"msg": "Audio processing failed", "error": str(e)}), 500


@routes_bp.route('/generate_embedding', methods=['POST'])
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


@routes_bp.route('/process_answers', methods=['POST'])
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


@routes_bp.route('/find_match', methods=['GET'])
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


@routes_bp.route('/api/user', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_user():
    if request.method == 'OPTIONS':
        return '', 204

    current_user_id = get_jwt_identity()
    try:
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "name": user.username,
            "role": user.role
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/store_answers', methods=['POST'])
@jwt_required()
def store_answers():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        answers = data.get('answers', [])

        # Process and store answers
        processed_answers = []
        for answer in answers:
            if isinstance(answer, str):
                if answer.startswith('blob:'):
                    # Handle audio recording
                    # You might want to store the audio file or process it
                    processed_answers.append({
                        'type': 'audio',
                        'content': answer
                    })
                else:
                    # Handle written answer
                    processed_answers.append({
                        'type': 'text',
                        'content': answer
                    })

        # Update user's answers in the database
        user = User.query.get(current_user_id)
        if user:
            user.answers = processed_answers
            db.session.commit()
            return jsonify({"message": "Answers stored successfully"}), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error storing answers: {str(e)}")
        return jsonify({"error": str(e)}), 500
