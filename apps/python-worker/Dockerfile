# 1. Base Image:
FROM python:3.9-slim

# 2. Set Working Directory
WORKDIR /app

# 3. Cache Dependencies: Copy only requirements.txt first
COPY requirements.txt .

# 4. Install Dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy Source Code: Bring the rest of the code
COPY . .

# 6. Default Command: Run the Python script
CMD ["python", "main.py"]