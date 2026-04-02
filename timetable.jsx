import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Timetable() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    // This magic syntax fetches the timetable AND the matching course code
    const { data, error } = await supabase
      .from('timetable')
      .select('*, courses(code, title)');
      
    if (!error && data) setSchedule(data);
    setLoading(false);
  };

  if (loading) return <p>Loading Timetable...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📅 Weekly Timetable</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {schedule.map((cls) => (
          <div key={cls.id} style={{ padding: '15px', borderLeft: '5px solid #3B82F6', background: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{cls.courses?.code} - {cls.courses?.title}</h3>
            <p style={{ margin: 0, color: '#555' }}>
              <strong>{cls.day}s</strong> | {cls.start_time} - {cls.end_time}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>📍 Venue: {cls.venue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
