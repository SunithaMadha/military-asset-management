from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, or_

from extensions import db
from models.expenditure import Expenditure
from models.purchase import Purchase
from models.transfer import Transfer
from models.assignment import Assignment
from models.base import Base
from models.equipment import EquipmentType
from models.audit_log import AuditLog
from middleware.rbac import role_required


expenditure_bp = Blueprint(
    "expenditures",
    __name__,
    url_prefix="/api/expenditures"
)


def calculate_balance(base_id, equipment_type_id):
    """
    Calculate currently available quantity.

    Balance =
    Purchases
    + Transfer In
    - Transfer Out
    - Assignments
    - Expenditures
    """

    purchase_total = db.session.query(
        func.coalesce(func.sum(Purchase.quantity), 0)
    ).filter(
        Purchase.base_id == base_id,
        Purchase.equipment_type_id == equipment_type_id
    ).scalar()

    transfer_in = db.session.query(
        func.coalesce(func.sum(Transfer.quantity), 0)
    ).filter(
        Transfer.to_base_id == base_id,
        Transfer.equipment_type_id == equipment_type_id,
        Transfer.status == "COMPLETED"
    ).scalar()

    transfer_out = db.session.query(
        func.coalesce(func.sum(Transfer.quantity), 0)
    ).filter(
        Transfer.from_base_id == base_id,
        Transfer.equipment_type_id == equipment_type_id,
        Transfer.status == "COMPLETED"
    ).scalar()

    assigned_total = db.session.query(
        func.coalesce(func.sum(Assignment.quantity), 0)
    ).filter(
        Assignment.base_id == base_id,
        Assignment.equipment_type_id == equipment_type_id
    ).scalar()

    expenditure_total = db.session.query(
        func.coalesce(func.sum(Expenditure.quantity), 0)
    ).filter(
        Expenditure.base_id == base_id,
        Expenditure.equipment_type_id == equipment_type_id
    ).scalar()

    balance = (
        purchase_total
        + transfer_in
        - transfer_out
        - assigned_total
        - expenditure_total
    )

    return balance


@expenditure_bp.route("", methods=["POST"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def create_expenditure():

    data = request.get_json()
    claims = get_jwt()

    user_id = int(claims["sub"])
    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    base_id = data.get("base_id")
    equipment_type_id = data.get("equipment_type_id")
    quantity = data.get("quantity")
    expenditure_date = data.get("expenditure_date")
    reason = data.get("reason")

    # Required fields
    if not base_id or not equipment_type_id or not quantity or not expenditure_date:
        return jsonify({
            "status": "error",
            "message": (
                "base_id, equipment_type_id, quantity "
                "and expenditure_date are required"
            )
        }), 400

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        if int(base_id) != int(user_base_id):
            return jsonify({
                "status": "error",
                "message": (
                    "You can only create expenditures "
                    "for your assigned base"
                )
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
            expenditure_date,
            "%Y-%m-%d"
        ).date()

    except ValueError:
        return jsonify({
            "status": "error",
            "message": (
                "expenditure_date must be in YYYY-MM-DD format"
            )
        }), 400

    # Check available balance
    available_balance = calculate_balance(
        base_id,
        equipment_type_id
    )

    if quantity > available_balance:
        return jsonify({
            "status": "error",
            "message": "Insufficient available quantity",
            "available_quantity": available_balance,
            "requested_quantity": quantity
        }), 400

    # Create expenditure
    expenditure = Expenditure(
        base_id=base_id,
        equipment_type_id=equipment_type_id,
        quantity=quantity,
        expenditure_date=parsed_date,
        reason=reason,
        recorded_by=user_id
    )

    db.session.add(expenditure)
    db.session.flush()

    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="CREATE",
        entity_type="EXPENDITURE",
        entity_id=expenditure.id,
        description=(
            f"Expended {quantity} unit(s) of "
            f"{equipment.name} at {base.name}. "
            f"Reason: {reason or 'Not specified'}"
        ),
        ip_address=request.remote_addr
    )

    db.session.add(audit)

    db.session.commit()

    remaining_balance = calculate_balance(
        base_id,
        equipment_type_id
    )

    return jsonify({
        "status": "success",
        "message": "Expenditure recorded successfully",
        "expenditure": {
            "id": expenditure.id,
            "base_id": expenditure.base_id,
            "base_name": base.name,
            "equipment_type_id": expenditure.equipment_type_id,
            "equipment_name": equipment.name,
            "quantity": expenditure.quantity,
            "expenditure_date": expenditure.expenditure_date.isoformat(),
            "reason": expenditure.reason,
            "remaining_quantity": remaining_balance
        }
    }), 201


@expenditure_bp.route("", methods=["GET"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def get_expenditures():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    query = Expenditure.query

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        query = query.filter(
            Expenditure.base_id == user_base_id
        )

    # Filters
    base_id = request.args.get("base_id")
    equipment_type_id = request.args.get("equipment_type_id")
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    if base_id:
        query = query.filter(
            Expenditure.base_id == base_id
        )

    if equipment_type_id:
        query = query.filter(
            Expenditure.equipment_type_id == equipment_type_id
        )

    if from_date:
        try:
            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()

            query = query.filter(
                Expenditure.expenditure_date >= parsed_from_date
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
                Expenditure.expenditure_date <= parsed_to_date
            )

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "to_date must be in YYYY-MM-DD format"
            }), 400

    expenditures = query.order_by(
        Expenditure.expenditure_date.desc()
    ).all()

    result = []

    for expenditure in expenditures:
        result.append({
            "id": expenditure.id,
            "base_id": expenditure.base_id,
            "base_name": expenditure.base.name,
            "equipment_type_id": expenditure.equipment_type_id,
            "equipment_name": expenditure.equipment_type.name,
            "quantity": expenditure.quantity,
            "expenditure_date": expenditure.expenditure_date.isoformat(),
            "reason": expenditure.reason
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "expenditures": result
    })


@expenditure_bp.route("/<int:expenditure_id>", methods=["GET"])
@jwt_required()
@role_required("ADMIN", "BASE_COMMANDER")
def get_expenditure(expenditure_id):

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    expenditure = Expenditure.query.get(expenditure_id)

    if not expenditure:
        return jsonify({
            "status": "error",
            "message": "Expenditure not found"
        }), 404

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        if expenditure.base_id != user_base_id:
            return jsonify({
                "status": "error",
                "message": "Access denied"
            }), 403

    return jsonify({
        "status": "success",
        "expenditure": {
            "id": expenditure.id,
            "base_id": expenditure.base_id,
            "base_name": expenditure.base.name,
            "equipment_type_id": expenditure.equipment_type_id,
            "equipment_name": expenditure.equipment_type.name,
            "quantity": expenditure.quantity,
            "expenditure_date": expenditure.expenditure_date.isoformat(),
            "reason": expenditure.reason
        }
    })