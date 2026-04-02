import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path points to your supabase file!

export default function Settings({ user }) {
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('Updating password...');
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Password updated successfully!');
      setPassword('');
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      setMessage('Uploading image...');
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setMessage('Profile picture updated successfully!');
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Account Settings</h2>
      {message && <p style={{ color: 'blue', fontWeight: 'bold' }}>{message}</p>}

      <div style={{ marginBottom: '30px', marginTop: '20px' }}>
        <h3>Change Profile Picture</h3>
        <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
        {uploading && <p>Uploading, please wait...</p>}
      </div>

      <hr />

      <div style={{ marginTop: '20px' }}>
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordUpdate}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', marginBottom: '10px', padding: '8px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 15px' }}>Update Password</button>
        </form>
      </div>
    </div>
  );
}
