from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import joblib
import os

app = Flask(__name__)

# Configure CORS to allow all origins for development
# In production, you should restrict this to your frontend domain
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Allow all origins for development
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Root route to verify the API is running
@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'Audition No-Show Prediction API is running',
        'endpoints': {
            'predict': 'POST /predict',
            'retrain': 'POST /retrain'
        }
    })

# Sample data generation function
def generate_sample_data():
    np.random.seed(42)
    n_samples = 1000
    
    # Generate sample features
    days_until = np.random.randint(0, 30, n_samples)
    travel_time = np.random.uniform(0.1, 4, n_samples)  # in hours
    past_noshows = np.random.poisson(0.5, n_samples)  # poisson for count data
    confirmation = np.random.choice([0, 1], n_samples, p=[0.3, 0.7])
    time_of_day = np.random.choice([0, 1, 2], n_samples, p=[0.4, 0.4, 0.2])  # 0:morning, 1:afternoon, 2:evening
    is_weekend = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
    reminder_sent = np.random.choice([0, 1], n_samples, p=[0.2, 0.8])
    
    # Create target (1 for no-show, 0 for attend)
    # More likely to no-show with more days until, longer travel, more past no-shows, no confirmation, weekend
    prob = (days_until * 0.01 + 
            travel_time * 0.1 + 
            past_noshows * 0.2 + 
            (1 - confirmation) * 0.3 + 
            is_weekend * 0.1 + 
            (1 - reminder_sent) * 0.2 +
            np.random.normal(0, 0.1, n_samples))
    
    # Convert to binary (0 or 1)
    y = (prob > 0.5).astype(int)
    
    # Create DataFrame
    data = pd.DataFrame({
        'days_until': days_until,
        'travel_time': travel_time,
        'past_noshows': past_noshows,
        'confirmation': confirmation,
        'time_of_day': time_of_day,
        'is_weekend': is_weekend,
        'reminder_sent': reminder_sent,
        'will_attend': 1 - y  # Invert to match our target (1 = attend, 0 = no-show)
    })
    
    return data

# Train and save the model
def train_model():
    # Generate sample data
    data = generate_sample_data()
    
    # Prepare features and target
    X = data.drop('will_attend', axis=1)
    y = data['will_attend']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train SVM model
    model = SVC(kernel='rbf', probability=True, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model trained with accuracy: {accuracy:.2f}")
    
    # Save model and scaler
    joblib.dump(model, 'model.joblib')
    joblib.dump(scaler, 'scaler.joblib')
    
    return model, scaler, accuracy

# Load or train model
model_path = 'model.joblib'
scaler_path = 'scaler.joblib'

if os.path.exists(model_path) and os.path.exists(scaler_path):
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    print("Loaded pre-trained model and scaler")
else:
    print("Training new model...")
    model, scaler, _ = train_model()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Prepare input features
        features = [
            data['daysUntil'],
            data['travelTime'],
            data['pastNoShows'],
            1 if data['isConfirmed'] == 'yes' else 0,
            ['morning', 'afternoon', 'evening'].index(data['timeOfDay']),
            1 if data['isWeekend'] else 0,
            1 if data['reminderSent'] else 0
        ]
        
        # Scale features and predict
        features_scaled = scaler.transform([features])
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]  # Probability of attending
        
        return jsonify({
            'willAttend': bool(prediction),
            'confidence': float(probability),
            'message': 'Will attend' if prediction else 'May not attend'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        global model, scaler
        model, scaler, accuracy = train_model()
        return jsonify({
            'success': True,
            'accuracy': accuracy,
            'message': f'Model retrained with accuracy: {accuracy:.2f}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
