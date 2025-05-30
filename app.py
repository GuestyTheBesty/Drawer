from flask import Flask, redirect, render_template, request, jsonify
import io 
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf



app = Flask(__name__, template_folder="templates", static_folder="static")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/guess", methods=["POST"])
def guess():
    blob = request.data
    if not blob: return jsonify({'error': 'No image data received'}), 400
    
    image = Image.open(io.BytesIO(blob))
    
    # Turn the RGBA image into a grayscale image
    background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    image = Image.alpha_composite(background, image).convert("L")

    image = ImageOps.invert(image) # MNIST training data has black background
    image = image.resize((28, 28), Image.LANCZOS) # AI is trained on 28x28 images

    image.save("lanczos.png")

    return jsonify({'message': 'Image received successfully'})


if __name__ == "__main__":
    app.run(debug=True)