import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

num_rows = 1000

start_time = datetime.now()
timestamps = [(start_time - timedelta(minutes=i)).timestamp() for i in range(num_rows)]

zones = ['A', 'B', 'C']

data = {
    'zone': [random.choice(zones) for _ in range(num_rows)],
    'traffic': np.random.rand(num_rows), 
    'pollution': np.random.rand(num_rows),
    'timestamp': timestamps
}

df = pd.DataFrame(data)

df.to_csv('data/sensor_readings.csv', index=False)

print("Dummy data file 'data/sensor_readings.csv' created successfully!")
