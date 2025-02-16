from flask import Flask, jsonify, request
from config import Config
from extensions import db, socketio
from flask_cors import CORS
from routes import routes_bp
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import psycopg2
import openai
import os
import numpy as np
import wave
from vosk import Model, KaldiRecognizer
import json
import requests  # Make sure to import requests if you're using an API
from flask_sqlalchemy import SQLAlchemy
from models import User
from utils import calculate_match_score


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app,
         resources={
             r"/*": {  # Changed from /api/* to /* to cover all routes
                 "origins": ["http://localhost:5173", "https://your-render-frontend-url.onrender.com"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"]
             }
         },
         supports_credentials=True)

    socketio.init_app(app,
                      cors_allowed_origins=["http://localhost:5173",
                                            "https://your-render-frontend-url.onrender.com"],
                      async_mode='gevent')

    configure_app(app)
    initialize_extensions(app)
    register_blueprints(app)

    # Database configuration
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))

    # OpenAI configuration
    openai.api_key = os.getenv('OPENAI_API_KEY')

    # Load the Vosk model
    # Update this path
    model_path = 'C:/Users/Deepak/Downloads/Compressed/soul/src/backend/vosk-model-small-en-us-0.15'
    model = Model(model_path)

    @app.route('/api/process_audio', methods=['POST'])
    def process_audio():
        audio_file = request.files['file']
        audio_file.save('uploads/audio.wav')

        # Convert audio to text
        text = convert_audio_to_text('uploads/audio.wav')

        # Generate embeddings using OpenAI
        embeddings = openai.Embedding.create(
            model='text-embedding-ada-002',
            input=text
        )

        # Store embeddings in your vector database
        store_embeddings(embeddings['data'])

        return jsonify({'message': 'Audio processed successfully', 'embeddings': embeddings})

    def convert_audio_to_text(audio_file_path):
        wf = wave.open(audio_file_path, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)

        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                results.append(rec.Result())
            else:
                results.append(rec.PartialResult())

        # Combine results
        final_result = ''
        for result in results:
            result_dict = json.loads(result)
            if 'text' in result_dict:
                final_result += result_dict['text'] + ' '

        return final_result.strip()

    def store_embeddings(embeddings):
        with conn.cursor() as cursor:
            cursor.execute(
                'INSERT INTO embeddings_table (embedding) VALUES (%s)', (embeddings,))
            conn.commit()

    @app.route("/save-interests", methods=["POST"])
    def save_interests():
        try:
            username = request.json.get("username")
            interests_vector = request.json.get("interests_vector")
            print("Received data:", username, interests_vector)  # Debugging

            result = conn.cursor()
            result.execute(
                "INSERT INTO users (username, interests_vector) VALUES (%s, %s) RETURNING *",
                (username, interests_vector)
            )
            conn.commit()
            print("Inserted data:", result.fetchone())  # Verify insertion
            return jsonify(result.fetchone()), 200
        except Exception as error:
            print("Database error:", error)  # Catch errors
            return jsonify({"error": "Failed to save interests"}), 500

    # Define the transcription function
    def transcribe_audio_function(audio_url):
        # Example using a hypothetical transcription API
        response = requests.post(
            # Replace with actual API endpoint
            "https://api.transcription-service.com/transcribe",
            json={"audio_url": audio_url},
            # Replace with your API key if needed
            headers={"Authorization": "Bearer YOUR_API_KEY"}
        )

        if response.status_code == 200:
            # Adjust based on the API response structure
            return response.json().get("transcript")
        else:
            print("Error transcribing audio:", response.text)
            return "Transcription failed"

    @app.route("/transcribe-audio", methods=["POST"])
    def transcribe_audio():
        audio_url = request.json.get("audioUrl")
        print("Transcribing audio:", audio_url)
        transcript = transcribe_audio_function(
            audio_url)  # Call the transcription function
        print("Transcript:", transcript)  # Check if text is extracted
        return jsonify({"transcript": transcript}), 200

    @app.route("/match-user", methods=["GET"])
    @jwt_required()
    def match_user():
        user_id = get_jwt_identity()
        threshold = 0.2  # Adjust this value

        try:
            # Get the current user's answers
            current_user = User.query.get(user_id)
            if not current_user or not current_user.answers:
                return jsonify({"error": "User or user answers not found"}), 404

            # Find closest match among online users
            online_users = User.query.filter(
                User.id != user_id,
                User.is_online == True,
                User.is_available == True,
                User.answers.isnot(None)
            ).all()

            best_match = None
            best_score = float('inf')

            for user in online_users:
                score = calculate_match_score(
                    current_user.answers, user.answers)
                if score < threshold and score < best_score:
                    best_match = user
                    best_score = score

            if not best_match:
                return jsonify({"error": "No suitable match found"}), 404

            return jsonify({
                "id": best_match.id,
                "username": best_match.username
            }), 200

        except Exception as e:
            print(f"Matching error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/profile", methods=["GET"])
    @jwt_required()
    def get_profile():
        try:
            # Get the current user's identity from the JWT token
            current_user_id = get_jwt_identity()

            # Fetch user profile from database
            cursor = conn.cursor()
            cursor.execute(
                "SELECT username, email, interests FROM users WHERE id = %s",
                (current_user_id,)
            )
            user = cursor.fetchone()

            if not user:
                return jsonify({"error": "User not found"}), 404

            return jsonify({
                "username": user[0],
                "email": user[1],
                "interests": user[2] if user[2] else []
            }), 200

        except Exception as e:
            print("Error fetching profile:", e)
            return jsonify({"error": "Failed to fetch profile"}), 500

    # Add user endpoint
    @app.route('/api/user', methods=['GET', 'OPTIONS'])
    def get_user():
        if request.method == 'OPTIONS':
            # Handle preflight request
            return '', 204

        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401

        try:
            # Extract token
            token = auth_header.split(' ')[1]
            # Verify token and get user info
            # Add your token verification logic here

            # Dummy response for now
            user_data = {
                'id': '1',
                'name': 'Test User',
                'role': 'user'
            }
            return jsonify(user_data), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 401

    @app.route("/api/store_answers", methods=['POST', 'OPTIONS'])
    @jwt_required()
    def store_answers():
        if request.method == 'OPTIONS':
            return '', 204

        current_user_id = get_jwt_identity()
        data = request.get_json()

        try:
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Store the answers and update user
            user.answers = data.get('answers', [])
            user.is_available = True
            db.session.commit()

            return jsonify({"message": "Answers stored successfully"}), 200
        except Exception as e:
            print(f"Error storing answers: {str(e)}")
            return jsonify({"error": str(e)}), 500

    # Error handlers
    @app.errorhandler(500)
    def handle_500_error(e):
        return jsonify({
            "msg": "Internal server error",
            "error": str(e)
        }), 500

    return app


def configure_app(app):
    """Configure application settings."""
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})


def initialize_extensions(app):
    """Initialize application extensions."""
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='gevent')
    JWTManager(app)


def register_blueprints(app):
    """Register application blueprints."""
    app.register_blueprint(routes_bp)


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")

    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
