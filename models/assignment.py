from extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

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

    personnel_name = db.Column(
        db.String(150)
    )

    personnel_id = db.Column(
        db.String(100)
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    assigned_date = db.Column(
        db.Date,
        nullable=False
    )

    assigned_by = db.Column(
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
        backref="assignments"
    )

    equipment_type = db.relationship(
        "EquipmentType",
        backref="assignments"
    )

    assigner = db.relationship(
        "User",
        foreign_keys=[assigned_by],
        backref="created_assignments"
    )