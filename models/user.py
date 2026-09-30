from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    full_name = db.Column(
        db.String(150)
    )

    role = db.Column(
        db.Enum(
            "ADMIN",
            "BASE_COMMANDER",
            "LOGISTICS_OFFICER"
        ),
        nullable=False
    )

    base_id = db.Column(
        db.Integer,
        db.ForeignKey("bases.id")
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

    # Relationship with Base
    base = db.relationship(
        "Base",
        backref="users"
    )