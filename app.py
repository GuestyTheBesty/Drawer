from flask import Flask, redirect, render_template, request, jsonify

app = Flask(__name__, template_folder="templates", static_folder="static")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/guess", methods=["POST"])
def guess():
    image_data = request.data

    if not image_data:
        return jsonify({'error': 'No image data received'}), 400
    
    with open('uploaded_image.png', 'wb') as f:
        f.write(image_data)
    
    return jsonify({'message': 'Image received successfully'})


if __name__ == "__main__":
    app.run(debug=True)