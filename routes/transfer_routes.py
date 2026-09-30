from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity
)

from extensions import db
from models.transfer import Transfer
from models.base import Base
from models.equipment import EquipmentType
from models.purchase import Purchase
from models.audit_log import AuditLog
from models.assignment import Assignment
from models.expenditure import Expenditure

from middleware.rbac import role_required


transfer_bp = Blueprint(
    "transfer",
    __name__,
    url_prefix="/api/transfers"
)


# =========================================================
# HELPER — CALCULATE CURRENT BALANCE
# =========================================================

def calculate_balance(base_id, equipment_type_id):

    purchases = db.session.query(
        db.func.coalesce(
            db.func.sum(Purchase.quantity), 0
        )
    ).filter(
        Purchase.base_id == base_id,
        Purchase.equipment_type_id == equipment_type_id
    ).scalar()

    transfer_in = db.session.query(
        db.func.coalesce(
            db.func.sum(Transfer.quantity), 0
        )
    ).filter(
        Transfer.to_base_id == base_id,
        Transfer.equipment_type_id == equipment_type_id,
        Transfer.status == "COMPLETED"
    ).scalar()

    transfer_out = db.session.query(
        db.func.coalesce(
            db.func.sum(Transfer.quantity), 0
        )
    ).filter(
        Transfer.from_base_id == base_id,
        Transfer.equipment_type_id == equipment_type_id,
        Transfer.status == "COMPLETED"
    ).scalar()

    assigned = db.session.query(
        db.func.coalesce(
            db.func.sum(Assignment.quantity), 0
        )
    ).filter(
        Assignment.base_id == base_id,
        Assignment.equipment_type_id == equipment_type_id
    ).scalar()

    expended = db.session.query(
        db.func.coalesce(
            db.func.sum(Expenditure.quantity), 0
        )
    ).filter(
        Expenditure.base_id == base_id,
        Expenditure.equipment_type_id == equipment_type_id
    ).scalar()

    balance = (
        purchases
        + transfer_in
        - transfer_out
        - assigned
        - expended
    )

    return balance


# =========================================================
# CREATE TRANSFER
# =========================================================

@transfer_bp.route("", methods=["POST"])
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def create_transfer():

    data = request.get_json()

    from_base_id = data.get("from_base_id")
    to_base_id = data.get("to_base_id")
    equipment_type_id = data.get("equipment_type_id")
    quantity = data.get("quantity")

    # -----------------------------------------------------
    # Required fields
    # -----------------------------------------------------

    if not from_base_id:
        return jsonify({
            "status": "error",
            "message": "from_base_id is required"
        }), 400

    if not to_base_id:
        return jsonify({
            "status": "error",
            "message": "to_base_id is required"
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

    # -----------------------------------------------------
    # Validate quantity
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Source and destination cannot be same
    # -----------------------------------------------------

    if from_base_id == to_base_id:

        return jsonify({
            "status": "error",
            "message": "Source and destination bases cannot be the same"
        }), 400

    # -----------------------------------------------------
    # Check bases
    # -----------------------------------------------------

    from_base = Base.query.get(from_base_id)
    to_base = Base.query.get(to_base_id)

    if not from_base:

        return jsonify({
            "status": "error",
            "message": "Source base not found"
        }), 404

    if not to_base:

        return jsonify({
            "status": "error",
            "message": "Destination base not found"
        }), 404

    # -----------------------------------------------------
    # Check equipment
    # -----------------------------------------------------

    equipment = EquipmentType.query.get(
        equipment_type_id
    )

    if not equipment:

        return jsonify({
            "status": "error",
            "message": "Equipment type not found"
        }), 404

    # -----------------------------------------------------
    # Get logged-in user
    # -----------------------------------------------------

    user_id = int(get_jwt_identity())

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    # -----------------------------------------------------
    # Base Commander restriction
    # -----------------------------------------------------

    if user_role == "BASE_COMMANDER":

        if user_base_id != from_base_id:

            return jsonify({
                "status": "error",
                "message": (
                    "Base Commander can only transfer "
                    "assets from their assigned base"
                )
            }), 403

    # -----------------------------------------------------
    # Calculate available balance
    # -----------------------------------------------------

    available_balance = calculate_balance(
        from_base_id,
        equipment_type_id
    )

    if quantity > available_balance:

        return jsonify({
            "status": "error",
            "message": "Insufficient asset balance",
            "available_balance": available_balance,
            "requested_quantity": quantity
        }), 400

    # -----------------------------------------------------
    # Create transfer
    # -----------------------------------------------------

    try:

        transfer = Transfer(
            from_base_id=from_base_id,
            to_base_id=to_base_id,
            equipment_type_id=equipment_type_id,
            quantity=quantity,
            status="COMPLETED",
            created_by=user_id
        )

        db.session.add(transfer)

        db.session.flush()

        # -------------------------------------------------
        # Audit log
        # -------------------------------------------------

        audit = AuditLog(
            user_id=user_id,
            action="CREATE_TRANSFER",
            entity_type="TRANSFER",
            entity_id=transfer.id,
            description=(
                f"Transferred {quantity} units of "
                f"{equipment.name} from "
                f"{from_base.name} to {to_base.name}"
            ),
            ip_address=request.remote_addr
        )

        db.session.add(audit)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Transfer completed successfully",
            "transfer": {
                "id": transfer.id,
                "from_base_id": transfer.from_base_id,
                "to_base_id": transfer.to_base_id,
                "equipment_type_id": transfer.equipment_type_id,
                "quantity": transfer.quantity,
                "status": transfer.status,
                "created_by": transfer.created_by
            }
        }), 201

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Transfer failed"
        }), 500


# =========================================================
# GET TRANSFERS
# =========================================================

@transfer_bp.route("", methods=["GET"])
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def get_transfers():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    query = Transfer.query

    base_id = request.args.get(
        "base_id",
        type=int
    )

    equipment_type_id = request.args.get(
        "equipment_type_id",
        type=int
    )

    status = request.args.get("status")

    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    # -----------------------------------------------------
    # Base Commander can only see their base
    # -----------------------------------------------------

    if user_role == "BASE_COMMANDER":

        query = query.filter(
            db.or_(
                Transfer.from_base_id == user_base_id,
                Transfer.to_base_id == user_base_id
            )
        )

    elif base_id:

        query = query.filter(
            db.or_(
                Transfer.from_base_id == base_id,
                Transfer.to_base_id == base_id
            )
        )

    # -----------------------------------------------------
    # Equipment filter
    # -----------------------------------------------------

    if equipment_type_id:

        query = query.filter(
            Transfer.equipment_type_id ==
            equipment_type_id
        )

    # -----------------------------------------------------
    # Status filter
    # -----------------------------------------------------

    if status:

        query = query.filter(
            Transfer.status == status
        )

    # -----------------------------------------------------
    # Date filter
    # -----------------------------------------------------

    if from_date:

        try:

            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            )

            query = query.filter(
                Transfer.transfer_date >=
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
            )

            query = query.filter(
                Transfer.transfer_date <
                datetime(
                    parsed_to_date.year,
                    parsed_to_date.month,
                    parsed_to_date.day + 1
                )
            )

        except ValueError:

            return jsonify({
                "status": "error",
                "message": "to_date must be YYYY-MM-DD"
            }), 400

    transfers = query.order_by(
        Transfer.transfer_date.desc()
    ).all()

    result = []

    for transfer in transfers:

        result.append({
            "id": transfer.id,
            "from_base_id": transfer.from_base_id,
            "from_base": transfer.from_base.name,
            "to_base_id": transfer.to_base_id,
            "to_base": transfer.to_base.name,
            "equipment_type_id": transfer.equipment_type_id,
            "equipment_name": transfer.equipment_type.name,
            "quantity": transfer.quantity,
            "status": transfer.status,
            "transfer_date": transfer.transfer_date.isoformat(),
            "created_by": transfer.created_by
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "transfers": result
    })


# =========================================================
# GET SINGLE TRANSFER
# =========================================================

@transfer_bp.route(
    "/<int:transfer_id>",
    methods=["GET"]
)
@jwt_required()
@role_required(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
)
def get_transfer(transfer_id):

    transfer = Transfer.query.get(
        transfer_id
    )

    if not transfer:

        return jsonify({
            "status": "error",
            "message": "Transfer not found"
        }), 404

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    if user_role == "BASE_COMMANDER":

        if (
            transfer.from_base_id != user_base_id
            and
            transfer.to_base_id != user_base_id
        ):

            return jsonify({
                "status": "error",
                "message": "Access denied"
            }), 403

    return jsonify({
        "status": "success",
        "transfer": {
            "id": transfer.id,
            "from_base_id": transfer.from_base_id,
            "from_base": transfer.from_base.name,
            "to_base_id": transfer.to_base_id,
            "to_base": transfer.to_base.name,
            "equipment_type_id": transfer.equipment_type_id,
            "equipment_name": transfer.equipment_type.name,
            "quantity": transfer.quantity,
            "status": transfer.status,
            "transfer_date": transfer.transfer_date.isoformat(),
            "created_by": transfer.created_by
        }
    })