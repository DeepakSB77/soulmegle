from openai import OpenAI
from app import app
import numpy as np

client = OpenAI(api_key=app.config['OPENAI_API_KEY'])


def transcribe_audio(audio_file):
    try:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return response.text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None


def get_embedding(text):
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def calculate_similarity(embedding1, embedding2):
    return 1 - np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
