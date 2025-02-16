from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from app import create_app
from extensions import db
from models import User


def create_migration_app():
    app = create_app()
    migrate = Migrate(app, db)
    return app, migrate


app, migrate = create_migration_app()

if __name__ == '__main__':
    app.run()
