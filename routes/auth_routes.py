from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash

from extensions import db
from models.user import User


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {
            "status": "error",
            "message": "Username and password are required"
        }, 400

    user = User.query.filter_by(
        username=username
    ).first()

    if not user:
        return {
            "status": "error",
            "message": "Invalid username or password"
        }, 401

    if not check_password_hash(
        user.password_hash,
        password
    ):
        return {
            "status": "error",
            "message": "Invalid username or password"
        }, 401

    if not user.is_active:
        return {
            "status": "error",
            "message": "User account is inactive"
        }, 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "base_id": user.base_id
        }
    )

    return {
        "status": "success",
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "base_id": user.base_id
        }
    }