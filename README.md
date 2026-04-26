# Invenio Ignis 🔥

> **AI-powered system that detects and predicts wildfires early by analyzing environmental and satellite data to enable rapid prevention and response.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16-FF6F00?logo=tensorflow)](https://www.tensorflow.org/)

Invenio Ignis is a modern, high-performance web application designed to predict and detect wildfires with high accuracy. Leveraging a deep learning pipeline and a cinematic, responsive frontend, it provides real-time confidence scores and dynamic geospatial visualizations (such as Air Quality Index mapping) based on satellite imagery.

## Features

- **Deep Learning Inference Engine**: A robust TensorFlow/Keras backend that processes satellite imagery using a custom neural network architecture to predict wildfire probabilities.
- **Cinematic UI/UX**: A highly polished, responsive frontend built with Next.js, Framer Motion, and Tailwind CSS. Features dynamic animations, full-screen interactive reveals, and a premium aesthetic.
- **Geospatial Visualizations**: Interactive mapping powered by Leaflet to render dynamic, organically morphing wildfire risk zones (Catmull-Rom splines) based on model confidence and spatial data.
- **Real-Time AQI Estimation**: Integration with environmental data services to assess and display real-time Air Quality Index metrics near predicted zones.

## Architecture & Tech Stack

- **Frontend (`/frontend`)**
  - **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
  - **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [DaisyUI](https://daisyui.com/)
  - **Animations**: [Framer Motion](https://www.framer.com/motion/)
  - **Mapping**: [React Leaflet](https://react-leaflet.js.org/)
- **Backend (`/backend`)**
  - **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
  - **Machine Learning**: [TensorFlow](https://www.tensorflow.org/) / [Keras](https://keras.io/)
  - **Data Processing**: NumPy, Pillow
  - **Server**: Uvicorn

## Project Structure

```text
DL-Project/
├── backend/                  # FastAPI backend service
│   ├── app/                  # Application code (routes, services, utils)
│   ├── tests/                # Pytest suites
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js application
│   ├── app/                  # Next.js app router pages & layout
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utilities and API clients
│   └── package.json          # Node dependencies
├── saved_model.keras         # Pre-trained deep learning model
└── Background.jpg            # High-fidelity UI background asset
```

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v20+)
- **Python** (3.10+)
- **NPM** or **Yarn**

> **Note**: The pre-trained model file (`saved_model.keras`) must be present in the root directory for the backend to run inference successfully.

### 1. Start the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`. API documentation is automatically generated at `http://localhost:8000/docs`.

### 2. Start the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` to access the application.

## Usage

1. Launch the application at `http://localhost:3000`.
2. Upload a satellite image for analysis. Note: For accurate geospatial placement, the filename should be formatted as `lon,lat.jpg` (e.g., `-113.92,50.90.jpg`).
3. The system will process the image through the inference pipeline and display the confidence score along with the risk zone visualizations on the map.

## License

This project is licensed under the MIT License.
