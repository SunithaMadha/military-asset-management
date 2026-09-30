from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash

from extensions import db
from models.user import User
from models.base import Base
from models.audit_log import AuditLog
from middleware.rbac import role_required


user_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/users"
)


@user_bp.route("", methods=["POST"])
@jwt_required()
@role_required("ADMIN")
def create_user():

    data = request.get_json()
    claims = get_jwt()

    admin_user_id = int(claims["sub"])

    username = data.get("username")
    password = data.get("password")
    full_name = data.get("full_name")
    role = data.get("role")
    base_id = data.get("base_id")

    # Required fields
    if not username or not password or not role:
        return jsonify({
            "status": "error",
            "message": "username, password and role are required"
        }), 400

    # Validate role
    allowed_roles = [
        "ADMIN",
        "BASE_COMMANDER",
        "LOGISTICS_OFFICER"
    ]

    if role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": "Invalid role"
        }), 400

    # Check duplicate username
    existing_user = User.query.filter_by(
        username=username
    ).first()

    if existing_user:
        return jsonify({
            "status": "error",
            "message": "Username already exists"
        }), 409

    # Validate base if provided
    base = None

    if base_id:
        base = Base.query.get(base_id)

        if not base:
            return jsonify({
                "status": "error",
                "message": "Base not found"
            }), 404

    # Base Commander must have a base
    if role == "BASE_COMMANDER" and not base_id:
        return jsonify({
            "status": "error",
            "message": "BASE_COMMANDER must be assigned to a base"
        }), 400

    # Create user
    user = User(
        username=username,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        role=role,
        base_id=base_id,
        is_active=True
    )

    db.session.add(user)
    db.session.flush()

    # Audit log
    audit = AuditLog(
        user_id=admin_user_id,
        action="CREATE",
        entity_type="USER",
        entity_id=user.id,
        description=f"Created user '{username}' with role '{role}'",
        ip_address=request.remote_addr
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "base_id": user.base_id,
            "is_active": user.is_active
        }
    }), 201


@user_bp.route("", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def get_users():

    users = User.query.order_by(
        User.id.asc()
    ).all()

    result = []

    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "base_id": user.base_id,
            "base_name": user.base.name if user.base else None,
            "is_active": user.is_active,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at else None
            )
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "users": result
    })


@user_bp.route("/<int:user_id>/status", methods=["PUT"])
@jwt_required()
@role_required("ADMIN")
def update_user_status(user_id):

    claims = get_jwt()
    admin_user_id = int(claims["sub"])

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    data = request.get_json()

    if "is_active" not in data:
        return jsonify({
            "status": "error",
            "message": "is_active is required"
        }), 400

    user.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=admin_user_id,
        action="UPDATE",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User '{user.username}' status changed to "
            f"{'ACTIVE' if user.is_active else 'INACTIVE'}"
        ),
        ip_address=request.remote_addr
    )

    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User status updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "is_active": user.is_active
        }
    })