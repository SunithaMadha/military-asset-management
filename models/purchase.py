from extensions import db


class Purchase(db.Model):
    __tablename__ = "purchases"

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

    purchase_date = db.Column(
        db.Date,
        nullable=False
    )

    supplier = db.Column(
        db.String(150)
    )

    reference_number = db.Column(
        db.String(100)
    )

    created_by = db.Column(
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
        backref="purchases"
    )

    equipment_type = db.relationship(
        "EquipmentType",
        backref="purchases"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[created_by],
        backref="created_purchases"
    )