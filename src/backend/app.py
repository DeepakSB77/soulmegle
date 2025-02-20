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
import requests  # Make sure to import requests if you're using an API
from pinecone import Pinecone


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Pinecone first
    try:
        from services.vector_services import initialize_pinecone
        print("Starting Pinecone initialization in create_app...")
        pc, index = initialize_pinecone()
        if pc and index:
            print("Pinecone initialized successfully in create_app")
            app.config['PINECONE_CLIENT'] = pc
            app.config['PINECONE_INDEX'] = index
        else:
            print("Warning: Pinecone initialization failed in create_app")
    except Exception as e:
        print(f"Error initializing Pinecone in create_app: {e}")

    # Register the blueprint only once
    from routes import routes_bp
    app.register_blueprint(routes_bp)
    print("Blueprint registered successfully")

    # Configure other app settings
    configure_app(app)
    initialize_extensions(app)
    
    return app


def configure_app(app):
    """Configure application settings."""
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})


def initialize_extensions(app):
    """Initialize application extensions."""
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='gevent')
    JWTManager(app)


def initialize_pinecone():
    try:
        print("Starting Pinecone initialization...")
        PINECONE_API_KEY = "your_api_key"
        pc = Pinecone(api_key=PINECONE_API_KEY)
        print("Pinecone client initialized successfully")
        
        index_name = "soulmegle"
        index = pc.Index(index_name)
        print("Pinecone index accessed successfully")
        return pc, index
    except Exception as e:
        print(f"Error initializing Pinecone: {e}")
        return None, None


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")

    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
