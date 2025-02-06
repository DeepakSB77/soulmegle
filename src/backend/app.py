from flask import Flask, jsonify
from config import Config
from extensions import db, socketio
from flask_cors import CORS
from routes import routes_bp
from flask_jwt_extended import JWTManager


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
