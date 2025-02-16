def calculate_match_score(answers1, answers2):
    """
    Calculate a similarity score between two sets of answers.
    Lower score means more similar.
    """
    if not answers1 or not answers2:
        return float('inf')

    try:
        score = 0
        for q1, q2 in zip(answers1, answers2):
            if q1 != q2:
                score += 1
        return score / len(answers1)
    except Exception as e:
        print(f"Error calculating match score: {str(e)}")
        return float('inf')
