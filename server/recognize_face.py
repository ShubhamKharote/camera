import sys
import json
import face_recognition

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"recognized": False, "error": "No image path provided"}))
        return

    input_path = sys.argv[1]
    known_image_path = './downloads/user_photo.png'

    try:
        # Load known face (from DB photo)
        known_image = face_recognition.load_image_file(known_image_path)
        known_encoding = face_recognition.face_encodings(known_image)[0]

        # Load captured face
        input_image = face_recognition.load_image_file(input_path)
        input_encoding = face_recognition.face_encodings(input_image)[0]

        # Compare faces
        results = face_recognition.compare_faces([known_encoding], input_encoding)
        recognized = results[0]

        print(json.dumps({"recognized": recognized, "name": "Shubham" if recognized else "Unknown"}))

    except Exception as e:
        print(json.dumps({"recognized": False, "error": str(e)}))

if __name__ == '__main__':
    main()
