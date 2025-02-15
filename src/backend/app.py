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
    def match_user():
        user_id = request.args.get("userId")
        threshold = 0.2  # Adjust this value

        # Get the current user's vector
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT interests_vector FROM users WHERE id = %s", (user_id,))
            current_user_vector = cursor.fetchone()[0]

            # Find closest match within threshold
            cursor.execute(
                """
                SELECT id, username, interests_vector <=> %s AS distance 
                FROM users 
                WHERE id != %s AND interests_vector <=> %s < %s 
                ORDER BY distance 
                LIMIT 1
                """,
                (current_user_vector, user_id, current_user_vector, threshold)
            )

            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "No match found"}), 404

            return jsonify({"id": result[0], "username": result[1]}), 200

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
