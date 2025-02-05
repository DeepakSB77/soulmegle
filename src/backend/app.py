from flask import Flask
from config import Config
from extensions import db, socketio
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})
    socketio.init_app(app)

    # Import and register routes here to avoid circular imports
    from routes import routes_bp  # Import the Blueprint
    app.register_blueprint(routes_bp)

    return app


app = create_app()

if __name__ == "__main__":
    socketio.run(app)
