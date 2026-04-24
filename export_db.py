#!/usr/bin/env python3
"""Export SAT question bank to JSON for Next.js app."""
import sqlite3
import json
import os

DB_PATH = "/Users/cesarguerrero/Desktop/Programación/Hermes outputs/sat_math_questions.db"
OUT_DIR = "/Users/cesarguerrero/Desktop/Programación/Hermes outputs/sat-practice-app/public/data"

os.makedirs(OUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Export all questions
cur.execute("""
    SELECT external_id, type, domain, domain_code, skill_code, skill_desc,
           difficulty, stem, answer_options, correct_answer, rationale,
           has_svg, has_mathml, assessment
    FROM questions
    ORDER BY domain, difficulty
""")

questions = []
for row in cur.fetchall():
    q = dict(row)
    # Parse answer_options from JSON string
    if q['answer_options']:
        try:
            q['answer_options'] = json.loads(q['answer_options'])
        except:
            pass
    # Parse correct_answer from JSON string
    if q['correct_answer']:
        try:
            q['correct_answer'] = json.loads(q['correct_answer'])
        except:
            pass
    # Parse assessments into array
    if q['assessment']:
        q['assessments'] = q['assessment'].split(',')
    else:
        q['assessments'] = []
    questions.append(q)

# Build stats
stats = {
    'total': len(questions),
    'by_assessment': {},
    'by_type': {},
    'by_domain': {},
    'by_difficulty': {},
    'by_assessment_combo': {}
}

for q in questions:
    # By assessment
    for a in q['assessments']:
        stats['by_assessment'][a] = stats['by_assessment'].get(a, 0) + 1
    # By type
    stats['by_type'][q['type']] = stats['by_type'].get(q['type'], 0) + 1
    # By domain
    stats['by_domain'][q['domain']] = stats['by_domain'].get(q['domain'], 0) + 1
    # By difficulty
    stats['by_difficulty'][q['difficulty']] = stats['by_difficulty'].get(q['difficulty'], 0) + 1
    # By assessment combo
    combo = q['assessment']
    stats['by_assessment_combo'][combo] = stats['by_assessment_combo'].get(combo, 0) + 1

# Write questions
with open(os.path.join(OUT_DIR, 'questions.json'), 'w') as f:
    json.dump(questions, f, ensure_ascii=False)

# Write stats
with open(os.path.join(OUT_DIR, 'stats.json'), 'w') as f:
    json.dump(stats, f, indent=2)

print(f"Exported {len(questions)} questions")
print(f"Stats: {json.dumps(stats, indent=2)}")

conn.close()
