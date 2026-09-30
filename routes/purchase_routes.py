from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity
)

from extensions import db
from models.purchase import Purchase
from models.base import Base
from models.equipment import EquipmentType
from models.audit_log import AuditLog

from middleware.rbac import role_required


purchase_bp = Blueprint(
    "purchase",
    __name__,
    url_prefix="/api/purchases"
)


# =========================================================
# CREATE PURCHASE
# =========================================================

@purchase_bp.route("", methods=["POST"])
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def create_purchase():

    data = request.get_json()

    base_id = data.get("base_id")
    equipment_type_id = data.get("equipment_type_id")
    quantity = data.get("quantity")
    purchase_date = data.get("purchase_date")
    supplier = data.get("supplier")
    reference_number = data.get("reference_number")

    # -------------------------
    # Required fields
    # -------------------------

    if not base_id:
        return jsonify({
            "status": "error",
            "message": "base_id is required"
        }), 400

    if not equipment_type_id:
        return jsonify({
            "status": "error",
            "message": "equipment_type_id is required"
        }), 400

    if quantity is None:
        return jsonify({
            "status": "error",
            "message": "quantity is required"
        }), 400

    if not purchase_date:
        return jsonify({
            "status": "error",
            "message": "purchase_date is required"
        }), 400

    # -------------------------
    # Quantity validation
    # -------------------------

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "quantity must be a valid number"
        }), 400

    if quantity <= 0:
        return jsonify({
            "status": "error",
            "message": "quantity must be greater than zero"
        }), 400

    # -------------------------
    # Date validation
    # -------------------------

    try:
        parsed_date = datetime.strptime(
            purchase_date,
            "%Y-%m-%d"
        ).date()

    except ValueError:
        return jsonify({
            "status": "error",
            "message": "purchase_date must be in YYYY-MM-DD format"
        }), 400

    # -------------------------
    # Check base
    # -------------------------

    base = Base.query.get(base_id)

    if not base:
        return jsonify({
            "status": "error",
            "message": "Base not found"
        }), 404

    # -------------------------
    # Check equipment
    # -------------------------

    equipment = EquipmentType.query.get(
        equipment_type_id
    )

    if not equipment:
        return jsonify({
            "status": "error",
            "message": "Equipment type not found"
        }), 404

    # -------------------------
    # Get logged-in user
    # -------------------------

    user_id = int(get_jwt_identity())

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    # -------------------------
    # Base Commander restriction
    # -------------------------

    if user_role == "BASE_COMMANDER":

        if user_base_id != base_id:

            return jsonify({
                "status": "error",
                "message": "You can only create purchases for your assigned base"
            }), 403

    # -------------------------
    # Create purchase
    # -------------------------

    purchase = Purchase(
        base_id=base_id,
        equipment_type_id=equipment_type_id,
        quantity=quantity,
        purchase_date=parsed_date,
        supplier=supplier,
        reference_number=reference_number,
        created_by=user_id
    )

    db.session.add(purchase)

    # Save first so purchase.id becomes available
    db.session.flush()

    # -------------------------
    # Audit log
    # -------------------------

    audit = AuditLog(
        user_id=user_id,
        action="CREATE_PURCHASE",
        entity_type="PURCHASE",
        entity_id=purchase.id,
        description=(
            f"Purchased {quantity} units of "
            f"{equipment.name} for {base.name}"
        ),
        ip_address=request.remote_addr
    )

    db.session.add(audit)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Purchase created successfully",
        "purchase": {
            "id": purchase.id,
            "base_id": purchase.base_id,
            "equipment_type_id": purchase.equipment_type_id,
            "quantity": purchase.quantity,
            "purchase_date": purchase.purchase_date.isoformat(),
            "supplier": purchase.supplier,
            "reference_number": purchase.reference_number,
            "created_by": purchase.created_by
        }
    }), 201


# =========================================================
# GET PURCHASES
# =========================================================

@purchase_bp.route("", methods=["GET"])
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def get_purchases():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    query = Purchase.query

    # -------------------------
    # Filters
    # -------------------------

    base_id = request.args.get(
        "base_id",
        type=int
    )

    equipment_type_id = request.args.get(
        "equipment_type_id",
        type=int
    )

    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    # -------------------------
    # Base Commander
    # -------------------------

    if user_role == "BASE_COMMANDER":

        query = query.filter(
            Purchase.base_id == user_base_id
        )

    else:

        if base_id:
            query = query.filter(
                Purchase.base_id == base_id
            )

    # -------------------------
    # Equipment filter
    # -------------------------

    if equipment_type_id:

        query = query.filter(
            Purchase.equipment_type_id ==
            equipment_type_id
        )

    # -------------------------
    # Date filters
    # -------------------------

    if from_date:

        try:
            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()

            query = query.filter(
                Purchase.purchase_date >=
                parsed_from_date
            )

        except ValueError:

            return jsonify({
                "status": "error",
                "message": "from_date must be YYYY-MM-DD"
            }), 400

    if to_date:

        try:
            parsed_to_date = datetime.strptime(
                to_date,
                "%Y-%m-%d"
            ).date()

            query = query.filter(
                Purchase.purchase_date <=
                parsed_to_date
            )

        except ValueError:

            return jsonify({
                "status": "error",
                "message": "to_date must be YYYY-MM-DD"
            }), 400

    purchases = query.order_by(
        Purchase.purchase_date.desc()
    ).all()

    result = []

    for purchase in purchases:

        result.append({
            "id": purchase.id,
            "base_id": purchase.base_id,
            "base_name": purchase.base.name,
            "equipment_type_id": purchase.equipment_type_id,
            "equipment_name": purchase.equipment_type.name,
            "quantity": purchase.quantity,
            "purchase_date": purchase.purchase_date.isoformat(),
            "supplier": purchase.supplier,
            "reference_number": purchase.reference_number,
            "created_by": purchase.created_by
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "purchases": result
    })


# =========================================================
# GET SINGLE PURCHASE
# =========================================================

@purchase_bp.route("/<int:purchase_id>", methods=["GET"])
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def get_purchase(purchase_id):

    purchase = Purchase.query.get(purchase_id)

    if not purchase:

        return jsonify({
            "status": "error",
            "message": "Purchase not found"
        }), 404

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    if (
        user_role == "BASE_COMMANDER"
        and purchase.base_id != user_base_id
    ):

        return jsonify({
            "status": "error",
            "message": "Access denied"
        }), 403

    return jsonify({
        "status": "success",
        "purchase": {
            "id": purchase.id,
            "base_id": purchase.base_id,
            "base_name": purchase.base.name,
            "equipment_type_id": purchase.equipment_type_id,
            "equipment_name": purchase.equipment_type.name,
            "quantity": purchase.quantity,
            "purchase_date": purchase.purchase_date.isoformat(),
            "supplier": purchase.supplier,
            "reference_number": purchase.reference_number,
            "created_by": purchase.created_by
        }
    })