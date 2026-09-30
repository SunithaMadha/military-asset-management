from extensions import db


class Expenditure(db.Model):
    __tablename__ = "expenditures"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    equipment_type_id = db.Column(
        db.Integer,
        db.ForeignKey("equipment_types.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    expenditure_date = db.Column(
        db.Date,
        nullable=False
    )

    reason = db.Column(
        db.String(255)
    )

    recorded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

    # Relationships
    base = db.relationship(
        "Base",
        backref="expenditures"
    )

    equipment_type = db.relationship(
        "EquipmentType",
        backref="expenditures"
    )

    recorder = db.relationship(
        "User",
        foreign_keys=[recorded_by],
        backref="recorded_expenditures"
    )