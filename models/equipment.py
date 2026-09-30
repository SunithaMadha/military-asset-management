from extensions import db


class EquipmentType(db.Model):
    __tablename__ = "equipment_types"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )