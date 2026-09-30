from werkzeug.security import generate_password_hash

password = "Admin@123"

hashed_password = generate_password_hash(password)

print(hashed_password)