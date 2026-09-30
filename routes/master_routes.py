from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from models.base import Base
from models.equipment import EquipmentType


master_bp = Blueprint(
    "master",
    __name__,
    url_prefix="/api"
)


@master_bp.route("/bases", methods=["GET"])
@jwt_required()
def get_bases():

    bases = Base.query.order_by(Base.name.asc()).all()

    result = []

    for base in bases:
        result.append({
            "id": base.id,
            "name": base.name,
            "location": base.location
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "bases": result
    })


@master_bp.route("/equipment-types", methods=["GET"])
@jwt_required()
def get_equipment_types():

    equipment_types = EquipmentType.query.order_by(
        EquipmentType.name.asc()
    ).all()

    result = []

    for equipment in equipment_types:
        result.append({
            "id": equipment.id,
            "name": equipment.name,
            "category": equipment.category,
            "description": equipment.description
        })

    return jsonify({
        "status": "success",
        "count": len(result),
        "equipment_types": result
    })