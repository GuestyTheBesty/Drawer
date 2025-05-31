from flask import Flask, redirect, render_template, request, jsonify
import io 
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf
from tensorflow.keras.models import load_model

app = Flask(__name__, template_folder="templates", static_folder="static")
model = load_model('mnist_model.keras')

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/guess", methods=["POST"])
def guess():
    blob = request.data
    if not blob: return jsonify({'error': 'No blob'}), 400
    
    image = Image.open(io.BytesIO(blob))
    
    # Turn the RGBA image into a grayscale image
    background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    image = Image.alpha_composite(background, image).convert("L")

    
    image = image.resize((28, 28), Image.BILINEAR) # AI is trained on 28x28 images
    image = ImageOps.invert(image) # MNIST training data has black background

    # Convert all non-black pixels to compeltely white
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            current_pixel = pixels[x, y]
            if current_pixel > 0:
                pixels[x, y] = 255
    
    image.save("bilinear.png")

    # Convert image to a readable array by the model
    image_array = np.array(image)
    image_array = image_array.astype('float32') / 255.0
    image_array = image_array.reshape(1, 28, 28, 1)
    
    prediction = model.predict(image_array)[0]
    prediction = [float(probability) for probability in prediction]

    return jsonify({'prediction':  prediction})


if __name__ == "__main__":
    app.run(debug=True)