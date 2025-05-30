from flask import Flask, redirect, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import io 

app = Flask(__name__, template_folder="templates", static_folder="static")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/guess", methods=["POST"])
def guess():
    blob = request.data
    
    if not blob:
        return jsonify({'error': 'No image data received'}), 400
    
    with open('uploaded_image.png', 'wb') as f:
        f.write(blob)
    
    return jsonify({'message': 'Image received successfully'})


if __name__ == "__main__":
    app.run(debug=True)