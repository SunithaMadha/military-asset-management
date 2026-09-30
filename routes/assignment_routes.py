from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models.assignment import Assignment
from models.base import Base
from models.equipment import EquipmentType
from models.audit_log import AuditLog
from middleware.rbac import role_required


assignment_bp = Blueprint(
    "assignments",
    __name__,
    url_prefix="/api/assignments"
)


@assignment_bp.route("", methods=["POST"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def create_assignment():

    data = request.get_json()
    claims = get_jwt()

    user_id = int(claims["sub"])
    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    base_id = data.get("base_id")
    equipment_type_id = data.get("equipment_type_id")
    personnel_name = data.get("personnel_name")
    personnel_id = data.get("personnel_id")
    quantity = data.get("quantity")
    assigned_date = data.get("assigned_date")

    # Required fields
    if not base_id or not equipment_type_id or not quantity or not assigned_date:
        return jsonify({
            "status": "error",
            "message": "base_id, equipment_type_id, quantity and assigned_date are required"
        }), 400

    # Base Commander can only assign equipment from their own base
    if user_role == "BASE_COMMANDER":
        if int(base_id) != int(user_base_id):
            return jsonify({
                "status": "error",
                "message": "You can only create assignments for your assigned base"
            }), 403

    # Validate base
    base = Base.query.get(base_id)

    if not base:
        return jsonify({
            "status": "error",
            "message": "Base not found"
        }), 404

    # Validate equipment
    equipment = EquipmentType.query.get(equipment_type_id)

    if not equipment:
        return jsonify({
            "status": "error",
            "message": "Equipment type not found"
        }), 404

    # Validate quantity
    try:
        quantity = int(quantity)

        if quantity <= 0:
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "message": "Quantity must be a positive integer"
        }), 400

    # Validate date
    try:
        parsed_date = datetime.strptime(
            assigned_date,
            "%Y-%m-%d"
        ).date()

    except ValueError:
        return jsonify({
            "status": "error",
            "message": "assigned_date must be in YYYY-MM-DD format"
        }), 400

    # Create assignment
    assignment = Assignment(
        base_id=base_id,
        equipment_type_id=equipment_type_id,
        personnel_name=personnel_name,
        personnel_id=personnel_id,
        quantity=quantity,
        assigned_date=parsed_date,
        assigned_by=user_id
    )

    db.session.add(assignment)
    db.session.flush()

    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity_type="ASSIGNMENT",
        entity_id=assignment.id,
        description=(
            f"Assigned {quantity} unit(s) of "
            f"{equipment.name} to {personnel_name or 'personnel'} "
            f"at {base.name}"
        ),
        ip_address=request.remote_addr
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Assignment created successfully",
        "assignment": {
            "id": assignment.id,
            "base_id": assignment.base_id,
            "base_name": base.name,
            "equipment_type_id": assignment.equipment_type_id,
            "equipment_name": equipment.name,
            "personnel_name": assignment.personnel_name,
            "personnel_id": assignment.personnel_id,
            "quantity": assignment.quantity,
            "assigned_date": assignment.assigned_date.isoformat()
        }
    }), 201


@assignment_bp.route("", methods=["GET"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def get_assignments():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    query = Assignment.query

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        query = query.filter(
            Assignment.base_id == user_base_id
        )

    # Filters
    base_id = request.args.get("base_id")
    equipment_type_id = request.args.get("equipment_type_id")
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    if base_id:
        query = query.filter(
            Assignment.base_id == base_id
        )

    if equipment_type_id:
        query = query.filter(
            Assignment.equipment_type_id == equipment_type_id
        )

    if from_date:
        try:
            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()

            query = query.filter(
                Assignment.assigned_date >= parsed_from_date
            )

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "from_date must be in YYYY-MM-DD format"
            }), 400

    if to_date:
        try:
            parsed_to_date = datetime.strptime(
                to_date,
                "%Y-%m-%d"
            ).date()

            query = query.filter(
                Assignment.assigned_date <= parsed_to_date
            )

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "to_date must be in YYYY-MM-DD format"
            }), 400

    assignments = query.order_by(
        Assignment.assigned_date.desc()
    ).all()

    result = []

    for assignment in assignments:
        result.append({
            "id": assignment.id,
            "base_id": assignment.base_id,
            "base_name": assignment.base.name,
            "equipment_type_id": assignment.equipment_type_id,
            "equipment_name": assignment.equipment_type.name,
            "personnel_name": assignment.personnel_name,
            "personnel_id": assignment.personnel_id,
            "quantity": assignment.quantity,
            "assigned_date": assignment.assigned_date.isoformat()
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "assignments": result
    })


@assignment_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def get_assignment(assignment_id):

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    assignment = Assignment.query.get(assignment_id)

    if not assignment:
        return jsonify({
            "status": "error",
            "message": "Assignment not found"
        }), 404

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        if assignment.base_id != user_base_id:
            return jsonify({
                "status": "error",
                "message": "Access denied"
            }), 403

    return jsonify({
        "status": "success",
        "assignment": {
            "id": assignment.id,
            "base_id": assignment.base_id,
            "base_name": assignment.base.name,
            "equipment_type_id": assignment.equipment_type_id,
            "equipment_name": assignment.equipment_type.name,
            "personnel_name": assignment.personnel_name,
            "personnel_id": assignment.personnel_id,
            "quantity": assignment.quantity,
            "assigned_date": assignment.assigned_date.isoformat()
        }
    })