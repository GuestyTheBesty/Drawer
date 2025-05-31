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
    if not blob: return jsonify({'error': 'No image data received'}), 400
    
    image = Image.open(io.BytesIO(blob))
    
    # Turn the RGBA image into a grayscale image
    background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    image = Image.alpha_composite(background, image).convert("L")

    # MNIST training data has black background
    image = image.resize((28, 28), Image.LANCZOS) # AI is trained on 28x28 images
    image = ImageOps.invert(image)

    pixels = image.load()  # Access pixel data

    for y in range(image.height):
        for x in range(image.width):
            current_pixel = pixels[x, y]
            if current_pixel > 0:  # Not black
                # Brighten pixel, for example by 30% (max 255)
                pixels[x, y] = 255

    # Convert image to a readable array by the model
    image_array = np.array(image)
    image_array = image_array.astype('float32') / 255.0
    image_array = image_array.reshape(1, 28, 28, 1)
    
    predictions = model.predict(image_array)[0]
    highest = 0
    num = 0
    for i, prediction in enumerate(predictions):
        if prediction > highest: 
            highest = prediction
            num = i
        print(i, prediction)
    
    print("It is ", num, " with ", f"{highest*100}.2f", "% probability", sep="")

    image.save("lanczos.png")

    return jsonify({'message': 'Image received successfully'})


if __name__ == "__main__":
    app.run(debug=True)