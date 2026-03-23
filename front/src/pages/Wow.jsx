import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // This is the axios instance we created earlier

export function Wow() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                // 🚀 Axios sends the request. 
                // Your interceptor automatically adds the 'Bearer <token>' header.
                const response = await api.get('accounts/me/');
                
                // 💾 Set the JSON response to state
                setData(response.data);
            } catch (err) {
                // ❌ Catch any 401 (Unauthorized) or 404 errors
                setError(err.response?.data || "Failed to fetch data from server.");
                console.error("API Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
<div style={{ padding: '20px', fontFamily: 'monospace' }}>
    <img src='https://i.pinimg.com/736x/6b/e3/50/6be350d7a0c9c82ec14696cb25c5fc12.jpg'></img>
            <h2>Developer Token & Data Debugger</h2>
            <hr />

            {loading && <p>Connecting to Django...</p>}

            {error && (
                <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
                    <strong>Error:</strong>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>
            )}

            {data && (
                <div style={{ marginTop: '20px' }}>
                    <p><strong>Raw JSON Response from /api/accounts/me/ :</strong></p>
                    <div style={{ 
                        backgroundColor: '#1e1e1e', 
                        color: '#d4d4d4', 
                        padding: '15px', 
                        borderRadius: '5px',
                        overflowX: 'auto' 
                    }}>
                        {/* ⚡ The '2' at the end adds the nice indentation */}
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            )}
            
            <button onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
                Refresh Data
            </button>
        </div>
    );
}