from typing import List, Dict
import numpy as np
from scipy.optimize import linear_sum_assignment

def solve_assignment(students: List[Dict], options: List[Dict]):
    """
    students: list of dicts {id: int, preferences: {option_id: rank}}
    options: list of dicts {id: int, capacity: int}
    
    Returns: dict {student_id: assigned_option_id}
    """
    if not students or not options:
        return {}
        
    # Expand options into slots based on capacity
    # slots maps column_index -> option_id
    slots = []
    for opt in options:
        cap = opt.get('capacity', 1)
        # Ensure capacity is at least 1 or handle 0
        cap = max(1, cap)
        for _ in range(cap):
            slots.append(opt['id'])
            
    num_students = len(students)
    num_slots = len(slots)
    
    if num_slots == 0:
        return {}

    # Cost matrix: Rows = Students, Cols = Slots
    # Initialize with high cost (1000)
    cost_matrix = np.full((num_students, num_slots), 1000)
    
    # Pre-calculate slot indices for each option
    option_to_cols = {}
    for col_idx, opt_id in enumerate(slots):
        if opt_id not in option_to_cols:
            option_to_cols[opt_id] = []
        option_to_cols[opt_id].append(col_idx)
        
    # Fill cost matrix
    for i, student in enumerate(students):
        prefs = student.get('preferences', {})
        for opt_id, rank in prefs.items():
            if opt_id in option_to_cols:
                for col_idx in option_to_cols[opt_id]:
                    cost_matrix[i, col_idx] = rank
                    
    # Solve
    row_ind, col_ind = linear_sum_assignment(cost_matrix)
    
    assignments = {}
    for r, c in zip(row_ind, col_ind):
        if r < len(students) and c < len(slots):
            student_id = students[r]['id']
            option_id = slots[c]
            assignments[student_id] = option_id
            
    return assignments
