import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function CourseView({ courseId, userRole }) {
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId);
      
    const { data: materialData } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId);

    setAssignments(assignmentData || []);
    setMaterials(materialData || []);
    setLoading(false);
  };

  if (loading) return <p>Loading course data...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Course Content</h2>

      <section style={{ marginBottom: '30px' }}>
        <h3>📚 Course Materials (PDFs)</h3>
        {materials.length === 0 ? <p>No PDFs uploaded yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {materials.map(mat => (
              <li key={mat.id} style={{ padding: '10px', background: '#f4f4f4', marginBottom: '5px' }}>
                📄 <strong>{mat.title}</strong> 
                <a href={mat.file_path} target="_blank" rel="noreferrer" style={{ marginLeft: '15px', color: 'blue' }}>View PDF</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>📝 Assignments</h3>
        {assignments.length === 0 ? <p>No pending assignments.</p> : (
          <div>
            {assignments.map(assn => (
              <div key={assn.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{assn.title}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{assn.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
                  <span style={{ color: 'red' }}>Due: {assn.due_date}</span>
                  <span>Score: {assn.max_score}</span>
                </div>
                {userRole === 'student' && (
                  <button style={{ padding: '5px 10px', background: '#3B82F6', color: 'white', border: 'none' }}>Submit Work</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
