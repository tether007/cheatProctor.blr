from flask import Flask, request, jsonify
import numpy as np
from datetime import datetime

app = Flask(__name__)

def calculate_risk_score(behavioral_data):
    # Initialize risk factors
    risk_score = 0

    # Extract events from the last 5 minutes
    current_time = datetime.now().timestamp() * 1000  # Convert to milliseconds
    recent_events = [
        event for event in behavioral_data 
        if current_time - event['timestamp'] <= 300000  # 5 minutes in milliseconds
    ]

    # Count different types of events
    tab_switches = len([e for e in recent_events if e['type'] == 'tabswitch'])
    blur_events = len([e for e in recent_events if e['type'] == 'blur'])
    mouse_moves = len([e for e in recent_events if e['type'] == 'mousemove'])

    # Calculate mouse movement patterns
    if mouse_moves > 0:
        mouse_positions = [
            (e['data']['x'], e['data']['y']) 
            for e in recent_events 
            if e['type'] == 'mousemove'
        ]

        # Calculate average distance between consecutive mouse positions
        distances = []
        for i in range(len(mouse_positions)-1):
            x1, y1 = mouse_positions[i]
            x2, y2 = mouse_positions[i+1]
            distance = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            distances.append(distance)

        avg_distance = np.mean(distances) if distances else 0

        # Detect suspicious patterns
        if avg_distance > 500:  # Large jumps
            risk_score += 15
        elif avg_distance < 5:  # Too precise/automated
            risk_score += 20
    else:
        risk_score += 25  # No mouse movement is suspicious

    # Tab switching analysis
    if tab_switches > 5:  # Frequent tab switching
        risk_score += min(tab_switches * 3, 30)

    # Window blur analysis
    if blur_events > 3:  # Frequent window switching
        risk_score += min(blur_events * 4, 40)

    # Normalize final score to 0-100 range
    return min(max(risk_score, 0), 100)

@app.route('/analyze', methods=['POST'])
def analyze_behavior():
    try:
        data = request.get_json()
        behavioral_data = data.get('behavioral_data', [])

        risk_score = calculate_risk_score(behavioral_data)

        return jsonify({
            'risk_score': risk_score,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)