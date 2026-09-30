from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            # Get JWT claims
            claims = get_jwt()

            user_role = claims.get("role")

            # Check role
            if user_role not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": "Access denied"
                }), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator