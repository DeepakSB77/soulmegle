from flask import Flask, jsonify, request
from config import Config
from extensions import db, socketio
from flask_cors import CORS
from routes import routes_bp
from flask_jwt_extended import JWTManager
import psycopg2
import openai
import os
import numpy as np
import wave
from vosk import Model, KaldiRecognizer
import json


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure CORS
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "OPTIONS"]
        }
    })

    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app,
                      cors_allowed_origins="*",
                      async_mode='gevent')
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(routes_bp)

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

    # Error handlers
    @app.errorhandler(500)
    def handle_500_error(e):
        return jsonify({
            "msg": "Internal server error",
            "error": str(e)
        }), 500

    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")

    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
