from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func

from extensions import db
from models.purchase import Purchase
from models.transfer import Transfer
from models.assignment import Assignment
from models.expenditure import Expenditure
from models.base import Base
from models.equipment import EquipmentType


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


def get_sum(model, quantity_column, filters):
    result = db.session.query(
        func.coalesce(func.sum(quantity_column), 0)
    ).filter(*filters).scalar()

    return int(result or 0)


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def dashboard():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    # Query parameters
    base_id = request.args.get("base_id")
    equipment_type_id = request.args.get("equipment_type_id")
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    # Base Commander can only see their own base
    if user_role == "BASE_COMMANDER":
        base_id = user_base_id

    # Validate base
    if base_id:
        try:
            base_id = int(base_id)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "base_id must be a valid integer"
            }), 400

        base = Base.query.get(base_id)

        if not base:
            return jsonify({
                "status": "error",
                "message": "Base not found"
            }), 404

    # Validate equipment type
    if equipment_type_id:
        try:
            equipment_type_id = int(equipment_type_id)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "equipment_type_id must be a valid integer"
            }), 400

        equipment = EquipmentType.query.get(equipment_type_id)

        if not equipment:
            return jsonify({
                "status": "error",
                "message": "Equipment type not found"
            }), 404

    # Parse dates
    parsed_from_date = None
    parsed_to_date = None

    if from_date:
        try:
            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()

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

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "to_date must be in YYYY-MM-DD format"
            }), 400

    if parsed_from_date and parsed_to_date:
        if parsed_from_date > parsed_to_date:
            return jsonify({
                "status": "error",
                "message": "from_date cannot be after to_date"
            }), 400

    # ---------------------------------------------------------
    # Build common filters
    # ---------------------------------------------------------

    purchase_base_filters = []

    if base_id:
        purchase_base_filters.append(
            Purchase.base_id == base_id
        )

    if equipment_type_id:
        purchase_base_filters.append(
            Purchase.equipment_type_id == equipment_type_id
        )

    transfer_in_filters = [
        Transfer.status == "COMPLETED"
    ]

    transfer_out_filters = [
        Transfer.status == "COMPLETED"
    ]

    assignment_filters = []
    expenditure_filters = []

    if base_id:
        transfer_in_filters.append(
            Transfer.to_base_id == base_id
        )

        transfer_out_filters.append(
            Transfer.from_base_id == base_id
        )

        assignment_filters.append(
            Assignment.base_id == base_id
        )

        expenditure_filters.append(
            Expenditure.base_id == base_id
        )

    if equipment_type_id:

        transfer_in_filters.append(
            Transfer.equipment_type_id == equipment_type_id
        )

        transfer_out_filters.append(
            Transfer.equipment_type_id == equipment_type_id
        )

        assignment_filters.append(
            Assignment.equipment_type_id == equipment_type_id
        )

        expenditure_filters.append(
            Expenditure.equipment_type_id == equipment_type_id
        )

    # ---------------------------------------------------------
    # Opening Balance
    #
    # Everything BEFORE from_date
    # ---------------------------------------------------------

    opening_balance = 0

    if parsed_from_date:

        purchase_filters = list(purchase_base_filters)

        purchase_filters.append(
            Purchase.purchase_date < parsed_from_date
        )

        transfer_in_opening = list(transfer_in_filters)

        transfer_in_opening.append(
            Transfer.transfer_date < datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

        transfer_out_opening = list(transfer_out_filters)

        transfer_out_opening.append(
            Transfer.transfer_date < datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

        assignment_opening = list(assignment_filters)

        assignment_opening.append(
            Assignment.assigned_date < parsed_from_date
        )

        expenditure_opening = list(expenditure_filters)

        expenditure_opening.append(
            Expenditure.expenditure_date < parsed_from_date
        )

        opening_purchases = get_sum(
            Purchase,
            Purchase.quantity,
            purchase_filters
        )

        opening_transfer_in = get_sum(
            Transfer,
            Transfer.quantity,
            transfer_in_opening
        )

        opening_transfer_out = get_sum(
            Transfer,
            Transfer.quantity,
            transfer_out_opening
        )

        opening_assigned = get_sum(
            Assignment,
            Assignment.quantity,
            assignment_opening
        )

        opening_expended = get_sum(
            Expenditure,
            Expenditure.quantity,
            expenditure_opening
        )

        opening_balance = (
            opening_purchases
            + opening_transfer_in
            - opening_transfer_out
            - opening_assigned
            - opening_expended
        )

    # ---------------------------------------------------------
    # Current Period
    # ---------------------------------------------------------

    purchase_filters = list(purchase_base_filters)

    transfer_in_period = list(transfer_in_filters)
    transfer_out_period = list(transfer_out_filters)
    assignment_period = list(assignment_filters)
    expenditure_period = list(expenditure_filters)

    if parsed_from_date:
        purchase_filters.append(
            Purchase.purchase_date >= parsed_from_date
        )

        transfer_in_period.append(
            Transfer.transfer_date >= datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

        transfer_out_period.append(
            Transfer.transfer_date >= datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

        assignment_period.append(
            Assignment.assigned_date >= parsed_from_date
        )

        expenditure_period.append(
            Expenditure.expenditure_date >= parsed_from_date
        )

    if parsed_to_date:

        next_day = parsed_to_date + timedelta(days=1)

        purchase_filters.append(
            Purchase.purchase_date <= parsed_to_date
        )

        transfer_in_period.append(
            Transfer.transfer_date < datetime.combine(
                next_day,
                datetime.min.time()
            )
        )

        transfer_out_period.append(
            Transfer.transfer_date < datetime.combine(
                next_day,
                datetime.min.time()
            )
        )

        assignment_period.append(
            Assignment.assigned_date <= parsed_to_date
        )

        expenditure_period.append(
            Expenditure.expenditure_date <= parsed_to_date
        )

    # ---------------------------------------------------------
    # Calculate metrics
    # ---------------------------------------------------------

    purchases = get_sum(
        Purchase,
        Purchase.quantity,
        purchase_filters
    )

    transfer_in = get_sum(
        Transfer,
        Transfer.quantity,
        transfer_in_period
    )

    transfer_out = get_sum(
        Transfer,
        Transfer.quantity,
        transfer_out_period
    )

    assigned = get_sum(
        Assignment,
        Assignment.quantity,
        assignment_period
    )

    expended = get_sum(
        Expenditure,
        Expenditure.quantity,
        expenditure_period
    )

    net_movement = (
        purchases
        + transfer_in
        - transfer_out
    )

    closing_balance = (
        opening_balance
        + net_movement
        - assigned
        - expended
    )

    return jsonify({
        "status": "success",

        "filters": {
            "base_id": base_id,
            "equipment_type_id": equipment_type_id,
            "from_date": from_date,
            "to_date": to_date
        },

        "dashboard": {
            "opening_balance": opening_balance,
            "purchases": purchases,
            "transfer_in": transfer_in,
            "transfer_out": transfer_out,
            "net_movement": net_movement,
            "assigned": assigned,
            "expended": expended,
            "closing_balance": closing_balance
        }
    })

@dashboard_bp.route("/net-movement", methods=["GET"])
@jwt_required()
def net_movement_details():

    claims = get_jwt()

    user_role = claims.get("role")
    user_base_id = claims.get("base_id")

    base_id = request.args.get("base_id")
    equipment_type_id = request.args.get("equipment_type_id")
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    # Base Commander restriction
    if user_role == "BASE_COMMANDER":
        base_id = user_base_id

    # Validate base
    if base_id:
        try:
            base_id = int(base_id)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "base_id must be a valid integer"
            }), 400

    # Validate equipment
    if equipment_type_id:
        try:
            equipment_type_id = int(equipment_type_id)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "equipment_type_id must be a valid integer"
            }), 400

    # Parse dates
    parsed_from_date = None
    parsed_to_date = None

    if from_date:
        try:
            parsed_from_date = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()
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
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "to_date must be in YYYY-MM-DD format"
            }), 400

    # -----------------------------
    # Purchases
    # -----------------------------

    purchase_query = Purchase.query

    if base_id:
        purchase_query = purchase_query.filter(
            Purchase.base_id == base_id
        )

    if equipment_type_id:
        purchase_query = purchase_query.filter(
            Purchase.equipment_type_id == equipment_type_id
        )

    if parsed_from_date:
        purchase_query = purchase_query.filter(
            Purchase.purchase_date >= parsed_from_date
        )

    if parsed_to_date:
        purchase_query = purchase_query.filter(
            Purchase.purchase_date <= parsed_to_date
        )

    purchases = purchase_query.order_by(
        Purchase.purchase_date.desc()
    ).all()

    # -----------------------------
    # Transfer In
    # -----------------------------

    transfer_in_query = Transfer.query.filter(
        Transfer.status == "COMPLETED"
    )

    if base_id:
        transfer_in_query = transfer_in_query.filter(
            Transfer.to_base_id == base_id
        )

    if equipment_type_id:
        transfer_in_query = transfer_in_query.filter(
            Transfer.equipment_type_id == equipment_type_id
        )

    if parsed_from_date:
        transfer_in_query = transfer_in_query.filter(
            Transfer.transfer_date >= datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

    if parsed_to_date:
        transfer_in_query = transfer_in_query.filter(
            Transfer.transfer_date < datetime.combine(
                parsed_to_date + timedelta(days=1),
                datetime.min.time()
            )
        )

    transfers_in = transfer_in_query.order_by(
        Transfer.transfer_date.desc()
    ).all()

    # -----------------------------
    # Transfer Out
    # -----------------------------

    transfer_out_query = Transfer.query.filter(
        Transfer.status == "COMPLETED"
    )

    if base_id:
        transfer_out_query = transfer_out_query.filter(
            Transfer.from_base_id == base_id
        )

    if equipment_type_id:
        transfer_out_query = transfer_out_query.filter(
            Transfer.equipment_type_id == equipment_type_id
        )

    if parsed_from_date:
        transfer_out_query = transfer_out_query.filter(
            Transfer.transfer_date >= datetime.combine(
                parsed_from_date,
                datetime.min.time()
            )
        )

    if parsed_to_date:
        transfer_out_query = transfer_out_query.filter(
            Transfer.transfer_date < datetime.combine(
                parsed_to_date + timedelta(days=1),
                datetime.min.time()
            )
        )

    transfers_out = transfer_out_query.order_by(
        Transfer.transfer_date.desc()
    ).all()

    return jsonify({
        "status": "success",

        "summary": {
            "purchases": sum(
                purchase.quantity for purchase in purchases
            ),

            "transfer_in": sum(
                transfer.quantity for transfer in transfers_in
            ),

            "transfer_out": sum(
                transfer.quantity for transfer in transfers_out
            )
        },

        "purchases": [
            {
                "id": purchase.id,
                "base_id": purchase.base_id,
                "base_name": purchase.base.name,
                "equipment_type_id": purchase.equipment_type_id,
                "equipment_name": purchase.equipment_type.name,
                "quantity": purchase.quantity,
                "purchase_date": purchase.purchase_date.isoformat(),
                "supplier": purchase.supplier,
                "reference_number": purchase.reference_number
            }
            for purchase in purchases
        ],

        "transfer_in": [
            {
                "id": transfer.id,
                "from_base_id": transfer.from_base_id,
                "from_base_name": transfer.from_base.name,
                "to_base_id": transfer.to_base_id,
                "to_base_name": transfer.to_base.name,
                "equipment_type_id": transfer.equipment_type_id,
                "equipment_name": transfer.equipment_type.name,
                "quantity": transfer.quantity,
                "transfer_date": transfer.transfer_date.isoformat(),
                "status": transfer.status
            }
            for transfer in transfers_in
        ],

        "transfer_out": [
            {
                "id": transfer.id,
                "from_base_id": transfer.from_base_id,
                "from_base_name": transfer.from_base.name,
                "to_base_id": transfer.to_base_id,
                "to_base_name": transfer.to_base.name,
                "equipment_type_id": transfer.equipment_type_id,
                "equipment_name": transfer.equipment_type.name,
                "quantity": transfer.quantity,
                "transfer_date": transfer.transfer_date.isoformat(),
                "status": transfer.status
            }
            for transfer in transfers_out
        ]
    })