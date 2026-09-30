from extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    action = db.Column(
        db.String(100)
    )

    entity_type = db.Column(
        db.String(100)
    )

    entity_id = db.Column(
        db.Integer
    )

    description = db.Column(
        db.Text
    )

    ip_address = db.Column(
        db.String(50)
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

    # Relationship
    user = db.relationship(
        "User",
        backref="audit_logs"
    )