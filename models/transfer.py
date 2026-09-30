from extensions import db


class Transfer(db.Model):
    __tablename__ = "transfers"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    from_base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id"),
        nullable=False
    )

    to_base_id = db.Column(
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

    transfer_date = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

    status = db.Column(
        db.Enum(
            "PENDING",
            "COMPLETED",
            "CANCELLED"
        ),
        default="COMPLETED"
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    # Relationships
    from_base = db.relationship(
        "Base",
        foreign_keys=[from_base_id],
        backref="transfers_out"
    )

    to_base = db.relationship(
        "Base",
        foreign_keys=[to_base_id],
        backref="transfers_in"
    )

    equipment_type = db.relationship(
        "EquipmentType",
        backref="transfers"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[created_by],
        backref="created_transfers"
    )