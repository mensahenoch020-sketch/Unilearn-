import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Grades({ user }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from('grades')
      .select('*, courses(code, title)')
      .eq('student_id', user.id);
      
    if (!error && data) setGrades(data);
    setLoading(false);
  };

  if (loading) return <p>Loading Grades...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 My Grades</h2>
      {grades.length === 0 ? <p>No grades posted yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#eee', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Course</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>CA1</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>CA2</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Midterm</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Exam</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => {
              // Calculate total score dynamically
              const total = (g.ca1 || 0) + (g.ca2 || 0) + (g.midterm || 0) + (g.exam || 0);
              return (
                <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong>{g.courses?.code}</strong></td>
                  <td style={{ padding: '10px' }}>{g.ca1}</td>
                  <td style={{ padding: '10px' }}>{g.ca2}</td>
                  <td style={{ padding: '10px' }}>{g.midterm}</td>
                  <td style={{ padding: '10px' }}>{g.exam}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: total >= 50 ? 'green' : 'red' }}>
                    {total} / 100
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
