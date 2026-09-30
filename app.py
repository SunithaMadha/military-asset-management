from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, jwt

from models import (
    Base,
    EquipmentType,
    User,
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    AuditLog
)

from routes.auth_routes import auth_bp
from middleware.rbac import role_required
from routes.purchase_routes import purchase_bp
from routes.transfer_routes import transfer_bp
from routes.assignment_routes import assignment_bp
from routes.expenditure_routes import expenditure_bp
from routes.dashboard_routes import dashboard_bp
from routes.master_routes import master_bp
from routes.user_routes import user_bp

def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(purchase_bp)
    app.register_blueprint(transfer_bp)
    app.register_blueprint(assignment_bp)
    app.register_blueprint(expenditure_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(master_bp)
    app.register_blueprint(user_bp)

    with app.app_context():
        print("Models loaded successfully")

    @app.route("/")
    def home():
        return {
            "message": "Military Asset Management API is running"
        }

  

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)