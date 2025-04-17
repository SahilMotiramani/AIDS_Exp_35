from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  

reg_model = joblib.load('price_regression_model.pkl')
clf_model = joblib.load('price_classification_model.pkl')
label_encoders = joblib.load('label_encoders.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        input_data = pd.DataFrame([data])

        for col in ['State', 'City', 'Crop Type', 'Season']:
            input_data[col] = label_encoders[col].transform([data[col]])[0]
        price_pred = reg_model.predict(input_data)[0]

        if price_pred > 60:
            category = 'High'
        elif 35 <= price_pred <= 60:
            category = 'Moderate'
        else:
            category = 'Low'
        category_pred = clf_model.predict(input_data)[0]
        print(f"Predicted Price: {price_pred}")
        print(f"Predicted Category (encoded): {category_pred}")
        print(f"Mapped Category (based on price): {category}")

        return jsonify({
            'predicted_price': float(price_pred),
            'price_category': category
        })

    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
