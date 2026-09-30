from extensions import db


class Base(db.Model):
    __tablename__ = "bases"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(150))
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )