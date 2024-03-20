from flask import Flask, redirect, render_template, request, jsonify, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
# Import for hashing passwords (if managing user accounts)
from werkzeug.security import generate_password_hash, check_password_hash
# HTTP request with route handlers
# import requests
from datetime import datetime

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ChainTrack.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Optional: to suppress a warning

# Initialize the database
db = SQLAlchemy(app)

# Initialize Flask Migrate
migrate = Migrate(app, db)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(128))

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    product_id = db.Column(db.Text, unique=True, nullable=False)
    production_date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

class ContactRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    job_title = db.Column(db.String(120), nullable=True)
    phone_number = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)

@app.route('/')
def home():
    return render_template('HomePage.html')

@app.route('/about')
def about():
    return render_template('AboutUs.html')

@app.route('/login')
def login_page():
    return render_template('SignUp.html')

@app.route('/register')
def reg_page():
    return render_template('UserRegistration.html')

@app.route('/product_registration')
def product_registration():
    return render_template('ProductRegistration.html')

@app.route('/product_verification')
def product_verification():
    return render_template('ProductVerification.html')

@app.route('/product_tracking')
def product_tracking():
    return render_template('ProductTracking.html')

# API Endpoints
@app.route('/signup', methods=['POST'])
def signup():
    # Assuming your form has fields for email and password
    name = request.form.get('name')
    email = request.form.get('email')
    telephone = request.form.get('telephone')
    password = request.form.get('password')
    hashed_password = generate_password_hash(password)
    
    # Creating a new User instance
    user = User(name=name, email=email, telephone=telephone, password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created successfully."}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        return jsonify({"message": "Login successful."}), 200
    else:
        return jsonify({"message": "Invalid email or password."}), 401

@app.route('/register_product', methods=['POST'])
def register_product():
    # Extracting form data
    name = request.form.get('name')
    product_id = request.form.get('product_id')
    date = request.form.get('date')
    location = request.form.get('location')
    description = request.form.get('description')

    # Convert the date to a datetime.date object
    if date:
        production_date = datetime.strptime(date, '%Y-%m-%d').date()
    else:
        production_date = None
    
    # Creating a new Product instance
    product = Product(name=name, product_id=product_id, production_date=production_date, location=location, description=description)
    db.session.add(product)
    db.session.commit()
    return redirect(url_for('dashboard'))  # Assuming 'dashboard' is the route to your dashboard
    return jsonify({"message": f"Product {name} registered successfully."}), 201

@app.route('/verify_product', methods=['GET'])
def verify_product():
    product_id = request.args.get('product_id')
    product = Product.query.get(product_id)
    if product:
        return jsonify({"product_name": product.name}), 200
    else:
        return jsonify({"message": "Product not found."}), 404

@app.route('/track_product', methods=['GET'])
def track_product():
    # Assuming you have a tracking mechanism or data
    product_id = request.args.get('product_id')
    product = Product.query.get(product_id)
    if product:
        # Placeholder for tracking logic
        return jsonify({"product_name": product.name, "status": "In transit"}), 200
    else:
        return jsonify({"message": "Product not found."}), 404

@app.route('/contact_us', methods=['POST'])
def contact_us():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    job_title = request.form.get('job_title', '')  # Optional field
    phone_number = request.form.get('phone_number')
    message = request.form.get('message')
    
    # If storing in database
    contact_request = ContactRequest(
        first_name=first_name,
        last_name=last_name,
        email=email,
        job_title=job_title,
        phone_number=phone_number,
        message=message
    )
    db.session.add(contact_request)
    db.session.commit()
    
    # Here you could also send an email notification, log the request, etc.
    
    # Provide feedback or redirect as appropriate
    return jsonify({"message": "Your contact request has been submitted. We'll be in touch soon!"}), 201

if __name__ == '__main__':
    # Create tables if they don't exist yet
    with app.app_context():
        db.create_all()
    app.run(debug=True)
